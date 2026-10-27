const admin = require('firebase-admin');
const { getConfig } = require('./config');

let messaging;

function getMessaging() {
  if (messaging) {
    return messaging;
  }

  const { firebase } = getConfig();
  if (!firebase.projectId || !firebase.clientEmail || !firebase.privateKey) {
    throw new Error('Firebase Cloud Messaging is not configured');
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebase.projectId,
        clientEmail: firebase.clientEmail,
        privateKey: firebase.privateKey
      })
    });
  }

  messaging = admin.messaging();
  return messaging;
}

async function sendToDevices(tokens, notification) {
  return getMessaging().sendEachForMulticast({ tokens, notification });
}

module.exports = { sendToDevices };
