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

/**
 * Assign the 'isAdmin' custom claim to a user
 * @param {string} uid - Firebase Authentication user ID
 */
async function assignAdminRole(uid) {
  try {
      await auth.setCustomUserClaims(uid, { isAdmin: true });
      console.log(`Admin role assigned to user: ${uid}`);
  } catch (error) {
      console.error("Error assigning admin role:", error);
  }
}

/**
* Check if a user has the 'isAdmin' claim
* @param {string} idToken - Firebase ID token from the user
* @returns {boolean} - True if the user is an admin, false otherwise
*/
async function checkIfAdmin(idToken) {
  try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken.isAdmin === true; // Returns true if `isAdmin` is true
  } catch (error) {
      console.error("Error verifying admin status:", error);
      return false; // Default to not admin in case of an error
  }
}

async function setDisplayName(uid, displayName) {
  const auth = getAuth();
  try {
      await auth.updateUser(uid, { displayName });
      console.log(`Display name for user with UID ${uid} updated to: ${displayName}`);
  } catch (error) {
      console.error("Error updating display name:", error);
  }
}

// Export the initialized Firebase Admin SDK for use in your backend
module.exports = { admin, db, auth, assignAdminRole, checkIfAdmin };