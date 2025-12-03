import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7xF1BCabRHIaYMveeFfEDviG2Oes1e-k",
  authDomain: "moizone-ai.firebaseapp.com",
  projectId: "moizone-ai",
  storageBucket: "moizone-ai.firebasestorage.app",
  messagingSenderId: "840867511376",
  appId: "1:840867511376:web:720afd7641345465ef2555",
  measurementId: "G-62TK3ZN38W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);