// src/lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBk40INf7A0q3f0xUrP7tOiG6iymlNh4Xg",
  authDomain: "presento-70ce6.firebaseapp.com",
  projectId: "presento-70ce6",
  storageBucket: "presento-70ce6.appspot.com", // ✅ FIXED
  messagingSenderId: "682254814685",
  appId: "1:682254814685:web:92da153ff64f57f35cba34",
};

// ✅ Prevent multiple initialization (VERY IMPORTANT for Next.js)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export services
export const auth = getAuth(app);
export const db = getFirestore(app);