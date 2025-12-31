// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');


const firebaseConfig = {
    apiKey: "AIzaSyD32e6wy6J7y1BTrnpc0ZvmMV9_C9ucxuI",
  authDomain: "sevadar-4d6d6.firebaseapp.com",
  projectId: "sevadar-4d6d6",
  storageBucket: "sevadar-4d6d6.firebasestorage.app",
  messagingSenderId: "1065558919744",
  appId: "1:1065558919744:web:7d7927ac6b8700d29e6da5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// This handles background notifications
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/posters/icon.png', // Uses your app icon
    badge: '/posters/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});