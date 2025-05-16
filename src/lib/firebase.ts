
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// User's actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiicnp2HIhUybhu67GU35EcMh5KQX09hY",
  authDomain: "quizwiz-72ij0.firebaseapp.com",
  databaseURL: "https://quizwiz-72ij0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quizwiz-72ij0",
  storageBucket: "quizwiz-72ij0.firebasestorage.app", // Corrected from user's paste, was .firebasestorage.app not .appspot.com for storage
  messagingSenderId: "21585103670",
  appId: "1:21585103670:web:8a1c20712f1a97b6d04197",
  measurementId: "G-Z661PFMKQ6"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Note: We are not explicitly initializing Firebase Analytics here,
// but the measurementId is included in the config.
// If Analytics is needed, it would be initialized like:
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);

export { app, auth, db };
