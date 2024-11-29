// backend/firebase-admin.js
require('dotenv').config();  // To access environment variables from .env file
const admin = require('firebase-admin');  // Firebase Admin SDK
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK using your service account
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);  // Path to the service account JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://europe-destinations-9509c-default-rtdb.firebaseio.com",
});

// Initialize Firestore Database
const db = getFirestore();
const auth = admin.auth();

// Export the initialized Firebase Admin SDK for use in your backend
module.exports = { admin, db };
