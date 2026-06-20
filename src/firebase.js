import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD3f_OWlNE1FKL_dSITuNLh6_jBAyOOQDc",
  authDomain: "team-19-33519.firebaseapp.com",
  projectId: "team-19-33519",
  storageBucket: "team-19-33519.firebasestorage.app",
  messagingSenderId: "631147657703",
  appId: "1:631147657703:web:793918f50f83db17a36542"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore（チャット用）
export const db = getFirestore(app);

// Messaging（通知用）
export const messaging = getMessaging(app);