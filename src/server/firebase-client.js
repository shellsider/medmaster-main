// src/lib/firebase/firebase-client.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDaHWQZ03zEuNWZ0xVYIvBctGeBTrHFde0",
    authDomain: "medmasters-838a3.firebaseapp.com",
    projectId: "medmasters-838a3",
    storageBucket: "medmasters-838a3.firebasestorage.app",
    messagingSenderId: "1023551882217",
    appId: "1:1023551882217:web:eaef312dddc3129eb98178",
    measurementId: "G-E8B48YZP23"
};

let firebaseApp;
if (!getApps().length) {
    // Always pass your configuration object
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp();
}

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
