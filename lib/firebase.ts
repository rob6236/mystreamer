// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- Your Firebase project config ---
const firebaseConfig = {
  apiKey: "AIzaSyACh64Bnq9lLUxsaaM8YNNgJwSvwbBarcQ",
  authDomain: "mystreamer-ca409.firebaseapp.com",
  projectId: "mystreamer-ca409",
  storageBucket: "mystreamer-ca409.firebasestorage.app",
  messagingSenderId: "767016752086",
  appId: "1:767016752086:web:b33ca9c15f8db02dc84a77",
};

// Prevent re-initializing during hot reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
