import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDYv6wA5oORN8EmEbysQVQ3x5enj8gRyVM",
  authDomain: "yesil-43ba4.firebaseapp.com",
  databaseURL: "https://yesil-43ba4-default-rtdb.firebaseio.com",
  projectId: "yesil-43ba4",
  storageBucket: "yesil-43ba4.firebasestorage.app",
  messagingSenderId: "203487504975",
  appId: "1:203487504975:web:847f97ab7057806cfd983a",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);