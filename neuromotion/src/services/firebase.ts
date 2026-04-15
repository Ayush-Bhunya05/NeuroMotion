// NeuroMotion AI — Firebase Setup
import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9xK1NKGDknXtmfF17rBAU0RoJdadydnk",
  authDomain: "nakshatra-4718b.firebaseapp.com",
  projectId: "nakshatra-4718b",
  storageBucket: "nakshatra-4718b.firebasestorage.app",
  messagingSenderId: "839243130271",
  appId: "1:839243130271:web:bc72f02acd8be3eb5d49aa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);

export default app;
