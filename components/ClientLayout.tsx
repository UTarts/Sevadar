'use client';
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import OfflineAlert from "@/components/OfflineAlert";
import VideoWidget from "@/components/VideoWidget";
import NotificationPanel from "@/components/NotificationPanel";
import { ProfileProvider } from "@/components/ProfileContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    // Listen for the 'open-notifications' signal from the Header
    const handleOpenNotif = () => setIsNotifOpen(true);
    window.addEventListener('open-notifications', handleOpenNotif);
    return () => window.removeEventListener('open-notifications', handleOpenNotif);
  }, []);

  return (
    <ProfileProvider>
      {children}
      
      {/* GLOBAL APP COMPONENTS */}
      <BottomNav />
      <OfflineAlert />
      <VideoWidget />
      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </ProfileProvider>
  );
}