import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARrOUzkwD6bBD_16bHrPTDJOOK7Wdu_3w",
  authDomain: "replit-71218.firebaseapp.com",
  projectId: "replit-71218",
  storageBucket: "replit-71218.firebasestorage.app",
  messagingSenderId: "1011849410012",
  appId: "1:1011849410012:web:5777989a3d93474fcd0b19",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let db;

try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });
} catch (e) {
  db = getFirestore(app);
}

export { db };