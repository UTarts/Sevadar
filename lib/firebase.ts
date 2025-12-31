// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { supabase } from './supabaseClient';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (Singleton pattern to avoid re-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const requestNotificationPermission = async (userId?: string) => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Notifications not supported on this browser");
      return null;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token && userId) {
        // Save token to Supabase
        await saveTokenToDatabase(token, userId);
      }
      return token;
    }
  } catch (error) {
    console.error("Notification permission error:", error);
    return null;
  }
};

async function saveTokenToDatabase(token: string, userId: string) {
  // Check if token exists to avoid duplicates
  const { data } = await supabase
    .from('fcm_tokens')
    .select('id')
    .eq('token', token)
    .single();

  if (!data) {
    await supabase.from('fcm_tokens').insert({
      user_id: userId,
      token: token,
      platform: 'web'
    });
    console.log("FCM Token saved to database");
  }
}