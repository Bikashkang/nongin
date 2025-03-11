import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Renamed for consistency

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrq6CjmkqiJbGiJwF2XPS4BfQKupN4amE",
  authDomain: "nongin-322ef.firebaseapp.com",
  projectId: "nongin-322ef",
  storageBucket: "nongin-322ef.firebasestorage.app",
  messagingSenderId: "854907375362",
  appId: "1:854907375362:web:1a0df5ddd5599e120efc1b",
  measurementId: "G-ERSPCCMEBJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth with React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});