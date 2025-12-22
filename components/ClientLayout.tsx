'use client';
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import OfflineAlert from "@/components/OfflineAlert";
import VideoWidget from "@/components/VideoWidget";
import NotificationPanel from "@/components/NotificationPanel";
import { ProfileProvider } from "@/components/ProfileContext";
import AuthModal from "@/components/AuthModal";
import OnboardingWizard from "@/components/OnboardingWizard"; 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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