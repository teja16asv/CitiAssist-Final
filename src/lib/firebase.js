import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace these with your actual Firebase project settings later
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFx85umUqKZ4TpSeEbdkqe6Mr8GGsPI0k",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "citiassit.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "citiassit",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "citiassit.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941638322930",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941638322930:web:650612c37f157547b9de6b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
