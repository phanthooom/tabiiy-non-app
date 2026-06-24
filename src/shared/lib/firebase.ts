import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyAam7HY4vTF_s7ySXJfh53jnzYYISTy3g8",
  authDomain: "tabiiy-non.firebaseapp.com",
  projectId: "tabiiy-non",
  storageBucket: "tabiiy-non.firebasestorage.app",
  messagingSenderId: "936547463418",
  appId: "1:936547463418:web:4e04ecc46be445a08f9943",
  measurementId: "G-D4MQ45NBXV"
}

export const app = initializeApp(firebaseConfig)

// Firestore
export const db = getFirestore(app)

// Auth
export const auth = getAuth(app)

// Analytics (только в браузере)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

// Storage
export const storage = getStorage(app)

// FCM — поддерживается не во всех браузерах (Safari, Telegram WebView)
export const getMessagingInstance = async () => {
  const supported = await isSupported()
  if (!supported) return null
  return getMessaging(app)
}

// VAPID ключ для FCM (получи в Firebase Console → Project Settings → Cloud Messaging)
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''
