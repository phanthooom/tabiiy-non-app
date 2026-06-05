import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

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
export const db = getFirestore(app)
