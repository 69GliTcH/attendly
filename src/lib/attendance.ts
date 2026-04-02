// src/lib/attendance.ts

import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

export type Status = "WFO" | "WFH" | "LEAVE" | "HOLIDAY";

/* ✅ Save attendance */
export const setAttendance = async (
  uid: string,
  date: string,
  status: Status
) => {
  await setDoc(doc(db, "attendance", uid, "records", date), {
    date,
    status,
    timestamp: Date.now(),
  });
};

/* ✅ Get one day */
export const getAttendance = async (uid: string, date: string) => {
  const docRef = doc(db, "attendance", uid, "records", date);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

/* ✅ Get all records */
export const getAllAttendance = async (uid: string) => {
  const colRef = collection(db, "attendance", uid, "records");
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((doc) => doc.data());
};

/* 🔥 NEW: Delete attendance (for unmark + undo) */
export const deleteAttendance = async (uid: string, date: string) => {
  const docRef = doc(db, "attendance", uid, "records", date);
  await deleteDoc(docRef);
};