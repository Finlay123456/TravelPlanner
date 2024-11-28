// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9uVLssNHCJCLKi0F0C7TiROlTzzEsQaM",
  authDomain: "europe-destinations-9509c.firebaseapp.com",
  projectId: "europe-destinations-9509c",
  storageBucket: "europe-destinations-9509c.firebasestorage.app",
  messagingSenderId: "175602744778",
  appId: "1:175602744778:web:97c943c77a928f67ffa333",
  measurementId: "G-JWWPKQ656L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);