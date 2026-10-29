const express = require('express');
const cors = require('cors');
const { getFirebase, sendToDevices, signInWithPassword } = require('./firebase');
const { requireAuth } = require('./auth');
const { getConfig } = require('./config');

const app = express();
const demoNews = [
  {
    id: 'demo-1',
    title: 'Actualización de la Ley de Procedimiento Administrativo',
    category: 'Administrativo',
    summary: 'Cambios en los plazos y en la tramitación electrónica.',
    publishedAt: new Date().toISOString(),
    reference: 'BOE-A-2026-10482'
  },
  {
    id: 'demo-2',
    title: 'Modificación de medidas de protección laboral',
    category: 'Laboral',
    summary: 'Nuevas disposiciones sobre conciliación y protección laboral.',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    reference: 'BOE-A-2026-10371'
  }
];
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function userData(user, name) {
  return {
    uid: user.uid,
    email: user.email,
    name: name || user.displayName || null,
    createdAt: new Date().toISOString()
  };
}

app.get('/', (req, res) => {
  res.json({ message: 'Marco Legal API funcionando con Firebase' });
});

app.get('/health', async (req, res, next) => {
  if (getConfig().demo) {
    return res.json({ status: 'OK', mode: 'demo', message: 'Backend funcionando en modo demo' });
  }
  try {
    await getFirebase().db.collection('news').limit(1).get();
    res.json({ status: 'OK', message: 'Firebase funcionando correctamente' });
  } catch (error) {
    next(error);
  }
});

app.post('/register', async (req, res, next) => {
  const { email, password, name } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password) || password.length < 6) {
    return res.status(400).json({
      error: 'email and password are required; password must contain at least 6 characters'
    });
  }

  if (getConfig().demo) {
    return res.status(201).json({
      user: { uid: 'demo-user', email: email.trim().toLowerCase(), name: name || 'Usuario demo' },
      token: 'demo-token'
    });
  }

  try {
    const { auth, db } = getFirebase();
    const user = await auth.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: isNonEmptyString(name) ? name.trim() : undefined
    });
    await db.collection('users').doc(user.uid).set(userData(user, name));
    await db.collection('preferences').doc(user.uid).set({
      emailNotifications: true,
      pushNotifications: true,
      categories: [],
      updatedAt: new Date().toISOString()
    });
    res.status(201).json({ user: userData(user, name) });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    next(error);
  }
});

app.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  if (getConfig().demo) {
    return res.json({
      user: { uid: 'demo-user', email: email.trim().toLowerCase(), name: 'Usuario demo' },
      token: 'demo-token',
      refreshToken: 'demo-refresh-token'
    });
  }

  try {
    const credentials = await signInWithPassword(
      email.trim().toLowerCase(),
      password
    );
    const user = await getFirebase().auth.getUser(credentials.localId);
    res.json({
      user: userData(user),
      token: credentials.idToken,
      refreshToken: credentials.refreshToken
    });
  } catch (error) {
    if (['INVALID_LOGIN_CREDENTIALS', 'EMAIL_NOT_FOUND', 'INVALID_PASSWORD']
      .includes(error.code)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(error);
  }
});

app.put('/profile', requireAuth, async (req, res, next) => {
  const { name } = req.body || {};
  if (!isNonEmptyString(name) || name.trim().length > 100) {
    return res.status(400).json({ error: 'name is required and must be at most 100 characters' });
  }
  const cleanName = name.trim();
  if (getConfig().demo) {
    return res.json({ user: { uid: req.user.uid, email: req.user.email, name: cleanName } });
  }
  try {
    const { auth, db } = getFirebase();
    const user = await auth.updateUser(req.user.uid, { displayName: cleanName });
    await db.collection('users').doc(user.uid).set({ name: cleanName }, { merge: true });
    res.json({ user: userData(user, cleanName) });
  } catch (error) {
    next(error);
  }
});

app.get('/profile', requireAuth, async (req, res, next) => {
  if (getConfig().demo) {
    return res.json({ user: { uid: req.user.uid, email: req.user.email, name: req.user.name || 'Usuario demo' } });
  }
  try {
    const { auth, db } = getFirebase();
    const user = await auth.getUser(req.user.uid);
    const snapshot = await db.collection('users').doc(req.user.uid).get();
    const name = snapshot.exists && isNonEmptyString(snapshot.data().name)
      ? snapshot.data().name.trim()
      : user.displayName;
    res.json({ user: userData(user, name) });
  } catch (error) {
    next(error);
  }
});

app.get('/news', async (req, res, next) => {
  if (getConfig().demo) {
    return res.json({ news: demoNews });
  }
  try {
    const snapshot = await getFirebase().db.collection('news')
      .where('publishedAt', '<=', new Date().toISOString())
      .orderBy('publishedAt', 'desc')
      .limit(50)
      .get();
    res.json({ news: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    next(error);
  }
});

app.get('/notifications', requireAuth, async (req, res, next) => {
  if (getConfig().demo) return res.json({ notifications: [] });
  try {
    const snapshot = await getFirebase().db.collection('notifications')
      .where('userId', '==', req.user.uid).limit(100).get();
    const notifications = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const newsSnapshot = await getFirebase().db.collection('news').doc(data.newsId).get();
      const news = newsSnapshot.exists ? newsSnapshot.data() : {};
      return {
        id: doc.id,
        ...data,
        title: news.title || 'Nueva publicación del BOE',
        summary: news.summary || news.description || '',
        category: news.category || 'General'
      };
    }));
    notifications.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

app.patch('/notifications/:notificationId/read', requireAuth, async (req, res, next) => {
  if (getConfig().demo) return res.json({ notification: { id: req.params.notificationId, read: true } });
  try {
    const ref = getFirebase().db.collection('notifications').doc(req.params.notificationId);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data().userId !== req.user.uid) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await ref.set({ read: true, readAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ notification: { id: ref.id, ...snapshot.data(), read: true } });
  } catch (error) {
    next(error);
  }
});

app.get('/history', requireAuth, async (req, res, next) => {
  if (getConfig().demo) return res.json({ history: [] });
  try {
    const snapshot = await getFirebase().db.collection('history')
      .where('userId', '==', req.user.uid).limit(100).get();
    const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.viewedAt || '').localeCompare(String(a.viewedAt || '')));
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

app.put('/history/:newsId', requireAuth, async (req, res, next) => {
  if (getConfig().demo) return res.json({ history: { newsId: req.params.newsId, userId: req.user.uid } });
  try {
    const entry = {
      newsId: req.params.newsId,
      userId: req.user.uid,
      viewedAt: new Date().toISOString()
    };
    await getFirebase().db.collection('history').doc(`${req.user.uid}_${req.params.newsId}`).set(entry, { merge: true });
    res.json({ history: entry });
  } catch (error) {
    next(error);
  }
});

app.get('/preferences', requireAuth, async (req, res, next) => {
  if (getConfig().demo) {
    return res.json({
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        categories: ['Civil', 'Penal', 'Laboral']
      }
    });
  }
  try {
    const { db } = getFirebase();
    let snapshot = await db.collection('preferences').doc(req.user.uid).get();
    if (!snapshot.exists) {
      const matches = await db.collection('preferences').where('uid', '==', req.user.uid).limit(1).get();
      snapshot = matches.docs[0] || snapshot;
    }
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    res.json({ preferences: snapshot.data() });
  } catch (error) {
    next(error);
  }
});

app.put('/preferences', requireAuth, async (req, res, next) => {
  const { emailNotifications, pushNotifications, categories } = req.body || {};
  if (typeof emailNotifications !== 'boolean' ||
      typeof pushNotifications !== 'boolean' ||
      !Array.isArray(categories) ||
      categories.some((category) => typeof category !== 'string')) {
    return res.status(400).json({ error: 'Invalid notification preferences' });
  }

  if (getConfig().demo) {
    return res.json({ preferences: { emailNotifications, pushNotifications, categories } });
  }

  try {
    const preferences = {
      emailNotifications,
      pushNotifications,
      categories,
      updatedAt: new Date().toISOString()
    };
    const { db } = getFirebase();
    const canonicalRef = db.collection('preferences').doc(req.user.uid);
    await canonicalRef.set(preferences, { merge: true });
    const legacy = await db.collection('preferences').where('uid', '==', req.user.uid).limit(1).get();
    if (!legacy.empty && legacy.docs[0].id !== req.user.uid) {
      await legacy.docs[0].ref.set(preferences, { merge: true });
    }
    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

app.post('/devices/token', requireAuth, async (req, res, next) => {
  const { token, provider = 'fcm' } = req.body || {};
  if (!isNonEmptyString(token) || token.trim().length > 4096) {
    return res.status(400).json({ error: 'token is required and must be at most 4096 characters' });
  }
  if (!['expo', 'fcm'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be expo or fcm' });
  }

  try {
    const device = {
      token: token.trim(),
      provider,
      userId: req.user.uid,
      active: true,
      updatedAt: new Date().toISOString()
    };
    await getFirebase().db.collection('deviceTokens').doc(token.trim()).set(device);
    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
});

app.delete('/devices/token', requireAuth, async (req, res, next) => {
  const { token } = req.body || {};
  if (!isNonEmptyString(token)) {
    return res.status(400).json({ error: 'token is required' });
  }

  try {
    const ref = getFirebase().db.collection('deviceTokens').doc(token.trim());
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data().userId !== req.user.uid) {
      return res.status(404).json({ error: 'Device token not found for this user' });
    }
    await ref.update({ active: false, updatedAt: new Date().toISOString() });
    res.json({ device: { ...snapshot.data(), active: false } });
  } catch (error) {
    next(error);
  }
});

app.post('/notifications/send', requireAuth, async (req, res, next) => {
  const { title, body, data } = req.body || {};
  if (!isNonEmptyString(title) || !isNonEmptyString(body)) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const snapshot = await getFirebase().db.collection('deviceTokens')
      .where('active', '==', true).get();
    const devices = snapshot.docs.map((doc) => doc.data());
    if (devices.length === 0) {
      return res.json({ sent: 0, failed: 0 });
    }

    const response = await sendToDevices(
      devices.map((device) => device.token),
      { title: title.trim(), body: body.trim(), ...(data ? { data } : {}) }
    );
    const batch = getFirebase().db.batch();
    response.responses.forEach((result, index) => {
      if (!result.success &&
          ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']
            .includes(result.error?.code)) {
        batch.update(snapshot.docs[index].ref, { active: false });
      }
    });
    await batch.commit();
    res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
