// Firebase Cloud Messaging Service Worker
// Обрабатывает push-уведомления когда приложение закрыто или в фоне

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyAam7HY4vTF_s7ySXJfh53jnzYYISTy3g8",
  authDomain: "tabiiy-non.firebaseapp.com",
  projectId: "tabiiy-non",
  storageBucket: "tabiiy-non.firebasestorage.app",
  messagingSenderId: "936547463418",
  appId: "1:936547463418:web:4e04ecc46be445a08f9943",
})

const messaging = firebase.messaging()

// Фоновые уведомления
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload)

  const { title, body, icon } = payload.notification ?? {}

  self.registration.showNotification(title ?? 'Tabiiy Non', {
    body: body ?? '',
    icon: icon ?? '/images/logo.png',
    badge: '/images/logo.png',
    data: payload.data,
  })
})
