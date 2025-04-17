// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY3f7iYhf9VK7TmKW0yvGCyUsa701xviQ",
  authDomain: "authspark-3xwgd.firebaseapp.com",
  projectId: "authspark-3xwgd",
  storageBucket: "authspark-3xwgd.firebasestorage.app",
  messagingSenderId: "1014029228966",
  appId: "1:1014029228966:web:add2bbf5ee30b4ccd58d67"
};

// Initialize Firebase
let app: FirebaseApp;

try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized in firebaseConfig.ts");

  // Initialize Firestore
  const db = getFirestore(app);
  console.log("Firestore initialized in firebaseConfig.ts");

  // Initialize Auth
  const auth = getAuth(app);
  console.log("Auth initialized in firebaseConfig.ts");

  // Connect to emulators in development
  if (process.env.NODE_ENV === 'development') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
} catch (error) {
  console.error("Error initializing Firebase in firebaseConfig.ts:", error);
  throw error;
}

export { app };