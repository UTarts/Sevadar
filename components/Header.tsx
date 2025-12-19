'use client';
import Link from "next/link";
import { Bell, User } from "lucide-react";
import { useProfile } from '@/components/ProfileContext';

export default function Header() {
  const { profile } = useProfile();

  // --- THIS WAS MISSING ---
  const openNotifications = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-notifications'));
    }
  };
  // ------------------------

  return (
    <div className="fixed top-0 w-full z-50 p-4">
      <header className="bg-gradient-to-r from-primary to-primary-dark text-white p-3 rounded-2xl border border-white/20 flex justify-between items-center shadow-[0_15px_20px_-8px_rgba(0,0,0,0.8)]">
        <Link href="/">
            <div>
              <h1 className="font-hindi text-xl font-bold tracking-wide">जय भारत, जय प्रतापगढ़</h1>
              <p className="text-[10px] text-primary-light opacity-100 font-medium tracking-wider">सेवादार MISSION 2029 (लोकसभा प्रतापगढ़)</p>
            </div>
        </Link>
        <div className="flex gap-2">
          <button 
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition active:scale-95" 
            onClick={openNotifications} // This works now because the function exists above
          >
            <Bell size={18} />
          </button>
          
          <Link href="/profile" className="relative group active:scale-95 transition">
            <div className={`p-[1.5px] rounded-full border-2 ${profile.photo ? 'border-white' : 'border-transparent'}`}>
                {profile.photo ? (
                    <img src={profile.photo} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20">
                        <User size={16} />
                    </div>
                )}
            </div>
          </Link>
        </div>
      </header>
    </div>
  );
}