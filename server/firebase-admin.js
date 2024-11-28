require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH); // Path from .env

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
