'use client';

import { useState, useEffect } from 'react';
import { translations } from '@/lib/translations'; 

// Define the shape of your translations for safety
interface TranslationText {
  title: string;
  message: string;
  allowBtn: string;
  laterBtn: string;
}

interface NotificationPromptProps {
  lang: 'en' | 'hi';
}

export default function NotificationPrompt({ lang }: NotificationPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  
  // robust fallback in case lang is undefined
  const t: TranslationText = translations.notificationParams[lang] || translations.notificationParams.en;

  useEffect(() => {
    // 1. Technical Check: Does browser support notifications?
    if (!('Notification' in window)) return;

    // 2. Permission Check: Only ask if status is 'default' (Not 'denied' or 'granted')
    if (Notification.permission === 'default') {
      
      // 3. User Preference Check: Did they say "Not Now" in this session?
      const hasDismissed = sessionStorage.getItem('notification_dismissed');
      
      if (!hasDismissed) {
        // 4. Delay: Wait 3 seconds so the site loads first (Better UX)
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnable = async () => {
    if (!('Notification' in window)) return;

    // This triggers the REAL native browser dialog
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Success! In future, you can add FCM token logic here
        console.log('User joined the Sevadar network!');
      }
    } catch (error) {
      console.error('Notification Error:', error);
    }
    
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mark as dismissed for this session
    sessionStorage.setItem('notification_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-end">
      
      {/* The Card */}
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-black ring-opacity-5 transition-all transform ease-out duration-300 border-l-4 border-[#FF9933]">
        <div className="p-4">
          <div className="flex items-start">
            
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="h-6 w-6 text-[#FF9933]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {t.title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300 leading-snug">
                {t.message}
              </p>
              
              {/* Buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleEnable}
                  className="inline-flex items-center rounded-md border border-transparent bg-[#FF9933] px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  {t.allowBtn}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="inline-flex items-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium leading-4 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none"
                >
                  {t.laterBtn}
                </button>
              </div>
            </div>

            {/* Close 'X' Button */}
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md bg-white dark:bg-zinc-900 text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={handleDismiss}
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}