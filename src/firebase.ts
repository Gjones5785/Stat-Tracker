
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfpKeYbDFhRHrZTa5vxFyOMYFG0G9UZvw",
  authDomain: "leaguelens-b3c5c.firebaseapp.com",
  projectId: "leaguelens-b3c5c",
  storageBucket: "leaguelens-b3c5c.firebasestorage.app",
  messagingSenderId: "645308928030",
  appId: "1:645308928030:web:11713e79cb4d6ab73cde0f",
  measurementId: "G-GKGTEKQ0KX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORTS REQUIRED BY APP
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Persistence
// This enables the app to work offline by caching data in IndexedDB
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firebase persistence failed: multiple tabs open');
  } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firebase persistence not supported');
  }
});

export const analytics = getAnalytics(app);
