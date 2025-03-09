// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, getDocs, doc} from "firebase/firestore";
import { initializeAuth, Persistence, getReactNativePersistence,browserLocalPersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrq6CjmkqiJbGiJwF2XPS4BfQKupN4amE",
  authDomain: "nongin-322ef.firebaseapp.com",
  projectId: "nongin-322ef",
  storageBucket: "nongin-322ef.firebasestorage.app",
  messagingSenderId: "854907375362",
  appId: "1:854907375362:web:1a0df5ddd5599e120efc1b",
  measurementId: "G-ERSPCCMEBJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Log to verify imports
console.log('Persistence options:', { browserLocalPersistence, getReactNativePersistence });

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(ReactNativeAsyncStorage),
});
