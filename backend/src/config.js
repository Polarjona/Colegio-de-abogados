require('dotenv').config();

const required = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

function getConfig() {
  const missing = required.filter((name) => !process.env[name]);
  const demo = process.env.DEMO_MODE === 'true' || missing.length > 0;
  if (missing.length > 0 && !demo) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: Number(process.env.PORT || 8080),
    demo,
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      webApiKey: process.env.FIREBASE_WEB_API_KEY
    }
  };
}

module.exports = { getConfig };
