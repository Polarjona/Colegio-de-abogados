const express = require('express');
const cors = require('cors');
const { getFirebase, sendToDevices, signInWithPassword } = require('./firebase');
const { requireAuth } = require('./auth');

const app = express();
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

app.get('/news', async (req, res, next) => {
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

app.get('/preferences', requireAuth, async (req, res, next) => {
  try {
    const snapshot = await getFirebase().db.collection('preferences').doc(req.user.uid).get();
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

  try {
    const preferences = {
      emailNotifications,
      pushNotifications,
      categories,
      updatedAt: new Date().toISOString()
    };
    await getFirebase().db.collection('preferences').doc(req.user.uid).set(preferences);
    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

app.post('/devices/token', requireAuth, async (req, res, next) => {
  const { token } = req.body || {};
  if (!isNonEmptyString(token) || token.trim().length > 4096) {
    return res.status(400).json({ error: 'token is required and must be at most 4096 characters' });
  }

  try {
    const device = {
      token: token.trim(),
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
