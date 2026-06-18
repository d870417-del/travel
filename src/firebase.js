import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnyhe3xQ2bFp1m_oOUrSpeV78NxJyjmYk",
  authDomain: "travel-pro-b8649.firebaseapp.com",
  projectId: "travel-pro-b8649",
  storageBucket: "travel-pro-b8649.firebasestorage.app",
  messagingSenderId: "878843278733",
  appId: "1:878843278733:web:d94ee0d2eb3616c00ff9c4",
  measurementId: "G-3YMN62QVDR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
