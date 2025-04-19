"use client";

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { connectAuthEmulator } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY3f7iYhf9VK7TmKW0yvGCyUsa701xviQ",
  authDomain: "authspark-3xwgd.firebaseapp.com",
  projectId: "authspark-3xwgd",
  storageBucket: "authspark-3xwgd.firebasestorage.app",
  messagingSenderId: "1014029228966",
  appId: "1:1014029228966:web:add2bbf5ee30b4ccd58d67"
};

// Initialize Firebase services
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== 'undefined') {
  try {
    // Initialize Firebase app if it hasn't been initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized");
    } else {
      app = getApps()[0];
      console.log("Using existing Firebase app");
    }
    
    // Initialize Auth
    auth = getAuth(app);
    console.log("Firebase auth initialized");
    
    // Initialize Firestore
    db = getFirestore(app);
    console.log("Firebase Firestore initialized");

    // Initialize Storage
    storage = getStorage(app);
    console.log("Firebase Storage initialized");

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
      // Comment out emulator connections to use production environment
      // connectFirestoreEmulator(db, 'localhost', 8080);
      // connectAuthEmulator(auth, 'http://localhost:9099');
      // connectStorageEmulator(storage, 'localhost', 9199);
      console.log("Using production Firebase environment");
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
}

export { app, auth, db, storage }; 