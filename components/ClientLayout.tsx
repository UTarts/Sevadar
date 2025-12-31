'use client';
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import OfflineAlert from "@/components/OfflineAlert";
import VideoWidget from "@/components/VideoWidget";
import NotificationPanel from "@/components/NotificationPanel";
import { ProfileProvider } from "@/components/ProfileContext";
import AuthModal from "@/components/AuthModal";
import OnboardingWizard from "@/components/OnboardingWizard"; 
// 1. Import the permission function
import { requestNotificationPermission } from '@/lib/firebase';
// 2. Import Supabase to check login status
import { supabase } from '@/lib/supabaseClient';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // --- NEW BLOCK: Automatically ask for permission when User Logs In ---
  useEffect(() => {
    // Check if already logged in on load
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            requestNotificationPermission(session.user.id);
        }
    };
    checkSession();

    // Listen for login events (e.g. when user finishes AuthModal)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        requestNotificationPermission(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // ---------------------------------------------------------------------

  useEffect(() => {
    const handleOpenNotif = () => setIsNotifOpen(true);
    const handleOpenAuth = () => setIsAuthOpen(true);
    
    window.addEventListener('open-notifications', handleOpenNotif);
    window.addEventListener('open-auth', handleOpenAuth);
    
    return () => {
      window.removeEventListener('open-notifications', handleOpenNotif);
      window.removeEventListener('open-auth', handleOpenAuth);
    };
  }, []);
  
  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('Automatic install prompt suppressed');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  return (
    <ProfileProvider>
      {children}
      
      <BottomNav />
      <OfflineAlert />
      <VideoWidget />
      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <OnboardingWizard />
    </ProfileProvider>
  );
}