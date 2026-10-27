const admin = require('firebase-admin');
const { getConfig } = require('./config');

let initialized = false;

function getFirebase() {
  if (!initialized) {
    const { firebase } = getConfig();
    if (!firebase.projectId || !firebase.clientEmail || !firebase.privateKey) {
      throw new Error('Firebase Admin is not configured');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebase.projectId,
        clientEmail: firebase.clientEmail,
        privateKey: firebase.privateKey
      }),
      projectId: firebase.projectId
    });
    initialized = true;
  }

  return {
    auth: admin.auth(),
    db: admin.firestore(),
    messaging: admin.messaging()
  };
}

async function signInWithPassword(email, password) {
  const { firebase } = getConfig();
  if (!firebase.webApiKey) {
    throw new Error('Firebase Web API key is not configured');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebase.webApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    }
  );
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Firebase authentication failed');
    error.code = payload.error?.message;
    throw error;
  }
  return payload;
}

async function sendToDevices(tokens, notification) {
  return getFirebase().messaging.sendEachForMulticast({ tokens, notification });
}

module.exports = { getFirebase, sendToDevices, signInWithPassword };
