const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');
const { fetchNews } = require('./boe-import');

const DEFAULT_SECTIONS = ['1', '3', '4', 'TC'];
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const expo = new Expo();

if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT no contiene una cuenta de servicio válida');
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function configuredSections() {
  return (process.env.BOE_SECTIONS || DEFAULT_SECTIONS.join(','))
    .split(',')
    .map((section) => section.trim())
    .filter(Boolean);
}

async function getPreference(uid, preferredDoc) {
  if (preferredDoc.exists) return preferredDoc.data();
  const matches = await db.collection('preferences').where('uid', '==', uid).limit(1).get();
  return matches.empty ? null : matches.docs[0].data();
}

async function sendNotifications(news) {
  const [preferencesSnapshot, tokensSnapshot] = await Promise.all([
    db.collection('preferences').get(),
    db.collection('deviceTokens').where('active', '==', true).get()
  ]);
  const messages = [];
  const notificationRecords = [];

  for (const preferenceDoc of preferencesSnapshot.docs) {
    const storedPreferences = preferenceDoc.data();
    const uid = storedPreferences.uid || preferenceDoc.id;
    const preferences = preferenceDoc.exists
      ? storedPreferences
      : await getPreference(uid, preferenceDoc);
    if (!preferences || preferences.pushNotifications !== true) continue;
    const categories = Array.isArray(preferences.categories)
      ? preferences.categories.map((category) => category.toLowerCase())
      : [];
    const userTokens = tokensSnapshot.docs
      .filter((tokenDoc) => tokenDoc.data().userId === uid)
      .map((tokenDoc) => ({ ref: tokenDoc.ref, ...tokenDoc.data() }));

    for (const item of news) {
      if (categories.length && !categories.includes(item.category)) continue;
      const notificationRef = db.collection('notifications').doc(`${uid}_${item.id}`);
      const existing = await notificationRef.get();
      if (existing.exists && existing.data().sent === true) continue;

      const expoTokens = userTokens.filter((token) =>
        token.provider === 'expo' || Expo.isExpoPushToken(token.token));
      for (const token of expoTokens) {
        messages.push({
          to: token.token,
          sound: 'default',
          title: item.title,
          body: item.summary,
          data: { newsId: item.id, url: item.boeUrl }
        });
      }
      notificationRecords.push({
        ref: notificationRef,
        userId: uid,
        newsId: item.id,
        tokens: expoTokens
      });
    }
  }

  const results = [];
  for (const chunk of expo.chunkPushNotifications(messages)) {
    results.push(...await expo.sendPushNotificationsAsync(chunk));
  }
  const successfulTokens = new Set();
  results.forEach((result, index) => {
    if (result.status === 'ok') successfulTokens.add(messages[index].to);
  });

  for (let offset = 0; offset < notificationRecords.length; offset += 400) {
    const batch = db.batch();
    for (const record of notificationRecords.slice(offset, offset + 400)) {
      const sent = record.tokens.some((token) => successfulTokens.has(token.token));
      batch.set(record.ref, {
        userId: record.userId,
        newsId: record.newsId,
        sent,
        sentAt: sent ? admin.firestore.FieldValue.serverTimestamp() : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
  }
  return { candidates: notificationRecords.length, sent: successfulTokens.size };
}

async function main() {
  const date = process.argv[2] || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sections = configuredSections();
  const news = await fetchNews(date, sections);
  const newNews = [];

  for (let offset = 0; offset < news.length; offset += 400) {
    const batch = db.batch();
    for (const item of news.slice(offset, offset + 400)) {
      const ref = db.collection('news').doc(item.id);
      const existing = await ref.get();
      if (!existing.exists) newNews.push(item);
      batch.set(ref, item, { merge: true });
    }
    await batch.commit();
  }

  const notificationResult = newNews.length
    ? await sendNotifications(newNews)
    : { candidates: 0, sent: 0 };
  console.log(JSON.stringify({
    date,
    read: news.length,
    new: newNews.length,
    notifications: notificationResult
  }));
}

main().catch((error) => {
  console.error(`Error sincronizando el BOE: ${error.message}`);
  process.exitCode = 1;
});
