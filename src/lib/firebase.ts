// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration is now hardcoded
const firebaseConfig: FirebaseOptions = {
  "projectId": "club-house-t50v6",
  "appId": "1:230928221464:web:017e8c5f758cfca03d8a6d",
  "storageBucket": "club-house-t50v6.firebasestorage.app",
  "apiKey": "AIzaSyCifokPPqenjxnZstWn3cy9xiK6U_mywPE",
  "authDomain": "club-house-t50v6.firebaseapp.com",
  "messagingSenderId": "230928221464"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
