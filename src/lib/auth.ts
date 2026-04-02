// src/lib/auth.ts

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";

// 🔍 Check if username exists
export const isUsernameTaken = async (username: string) => {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// 🔐 Signup
export const signup = async (
  username: string,
  password: string,
  attendanceCriteria: number
) => {
  // fake email (since Firebase needs email)
  const email = `${username}@app.com`;

  const res = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", res.user.uid), {
    username,
    attendanceCriteria,
    createdAt: Date.now(),
  });

  return res.user;
};

// 🔐 Login
export const login = async (username: string, password: string) => {
  const email = `${username}@app.com`;
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};