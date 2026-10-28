const { XMLParser } = require('fast-xml-parser');
const { Expo } = require('expo-server-sdk');
const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');

admin.initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 1 });

const db = admin.firestore();
const expo = new Expo();
const BOE_URL = 'https://www.boe.es/datosabiertos/api/boe/sumario';
const SECTIONS = new Set((process.env.BOE_SECTIONS || '1,3,4,TC').split(',').map((value) => value.trim()));

function asArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function categoryFor(title, section) {
  const value = `${section} ${title}`.toLowerCase();
  if (/(laboral|trabajador|empleo|seguridad social|convenio colectivo)/.test(value)) return 'laboral';
  if (/(penal|código penal|delito|criminal)/.test(value)) return 'penal';
  if (/(mercantil|sociedad mercantil|empresa|concurso)/.test(value)) return 'mercantil';
  if (/(fiscal|tributar|impuesto|hacienda)/.test(value)) return 'fiscal';
  if (/(civil|arrendamiento|vivienda|familia|consumidor)/.test(value)) return 'civil';
  return 'administrativo';
}

function parseSummary(xml, date) {
  const root = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' }).parse(xml);
  const diario = root?.response?.data?.sumario?.diario;
  if (!diario) throw new Error('El BOE no devolvió un sumario válido');
  const publishedAt = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00.000Z`;
  const news = [];

  for (const section of asArray(diario.seccion)) {
    const sectionCode = text(section['@_codigo']);
    if (!SECTIONS.has(sectionCode)) continue;
    for (const department of asArray(section.departamento)) {
      for (const epigraph of asArray(department.epigrafe)) {
        for (const item of asArray(epigraph.item)) {
          const id = text(item.identificador);
          const title = text(item.titulo);
          if (!id || !title) continue;
          const url = text(item.url_html) || `https://www.boe.es/diario_boe/txt.php?id=${id}`;
          news.push({
            id,
            title,
            category: categoryFor(title, text(section['@_nombre'])),
            description: text(epigraph['@_nombre']) || text(section['@_nombre']),
            summary: text(epigraph['@_nombre']) || text(section['@_nombre']),
            publishedAt,
            reference: id,
            boeUrl: url,
            sourceUrl: url,
            source: 'BOE'
          });
        }
      }
    }
  }
  return news;
}

async function sendNotifications(news) {
  const preferences = await db.collection('preferences').get();
  const tokens = await db.collection('deviceTokens').where('active', '==', true).get();
  const notifications = [];
  const expoMessages = [];
  const fcmMessages = [];

  for (const preference of preferences.docs) {
    const value = preference.data();
    if (value.pushNotifications !== true) continue;
    const categories = Array.isArray(value.categories) ? value.categories.map((item) => item.toLowerCase()) : [];
    const userTokens = tokens.docs
      .filter((doc) => doc.data().userId === preference.id)
      .map((doc) => ({ ref: doc.ref, ...doc.data() }));
    for (const item of news) {
      if (categories.length && !categories.includes(item.category)) continue;
      const notificationId = `${preference.id}_${item.id}`;
      const notificationRef = db.collection('notifications').doc(notificationId);
      const existing = await notificationRef.get();
      if (existing.exists && existing.data().sent === true) continue;

      const expoTokens = userTokens.filter((token) => token.provider === 'expo' || Expo.isExpoPushToken(token.token));
      for (const token of expoTokens) {
        expoMessages.push({
          to: token.token,
          sound: 'default',
          title: item.title,
          body: item.summary,
          data: { newsId: item.id, url: item.boeUrl }
        });
      }
      for (const token of userTokens.filter((value) => value.provider === 'fcm')) {
        fcmMessages.push({
          token: token.token,
          notification: { title: item.title, body: item.summary },
          data: { newsId: item.id, url: item.boeUrl }
        });
      }
      notifications.push({ ref: notificationRef, userId: preference.id, newsId: item.id, tokens: userTokens });
    }
  }

  const results = [];
  for (const chunk of expo.chunkPushNotifications(expoMessages)) {
    results.push(...await expo.sendPushNotificationsAsync(chunk));
  }
  const sentByToken = new Set();
  results.forEach((result, index) => {
    if (result.status === 'ok') sentByToken.add(expoMessages[index].to);
  });
  const sentFcmTokens = new Set();
  for (let offset = 0; offset < fcmMessages.length; offset += 500) {
    const chunk = fcmMessages.slice(offset, offset + 500);
    const response = await admin.messaging().sendEach(chunk);
    response.responses.forEach((result, index) => {
      if (result.success) sentFcmTokens.add(chunk[index].token);
    });
  }

  for (let offset = 0; offset < notifications.length; offset += 400) {
    const batch = db.batch();
    for (const notification of notifications.slice(offset, offset + 400)) {
      const sent = notification.tokens.some((token) =>
        sentByToken.has(token.token) || sentFcmTokens.has(token.token)
      );
      batch.set(notification.ref, {
        userId: notification.userId,
        newsId: notification.newsId,
        sent,
        sentAt: sent ? admin.firestore.FieldValue.serverTimestamp() : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
  }
  return { candidates: notifications.length, sent: sentByToken.size };
}

exports.importBoeHourly = onSchedule({
  schedule: '0 * * * *',
  timeZone: 'Europe/Madrid',
  retryCount: 3
}, async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const response = await fetch(`${BOE_URL}/${date}`, { headers: { Accept: 'application/xml' } });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`El BOE respondió con HTTP ${response.status}`);

  const news = parseSummary(await response.text(), date);
  const newNews = [];
  for (const item of news) {
    const ref = db.collection('news').doc(item.id);
    const existing = await ref.get();
    if (!existing.exists) newNews.push(item);
    await ref.set(item, { merge: true });
  }
  if (newNews.length) await sendNotifications(newNews);
  console.log(`BOE: ${news.length} leídas, ${newNews.length} nuevas`);
});
