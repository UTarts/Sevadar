'use client';
import Link from "next/link";
import { Bell, User } from "lucide-react";
import { useProfile } from '@/components/ProfileContext';

export default function Header() {
  const { profile } = useProfile();

  const openNotifications = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-notifications'));
    }
  };

  return (
    <div className="fixed top-0 w-full z-50 p-4">
      <header className="relative overflow-hidden bg-gradient-to-b from-orange-500 to-red-600 text-white p-3.5 rounded-2xl flex justify-between items-center shadow-[0_15px_20px_-8px_rgba(0,0,0,0.8)]">
        
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

        <Link href="/" className="relative z-10">
            <div>
              <h1 className="font-hindi text-xl font-bold tracking-wide drop-shadow-md">जय भारत, जय प्रतापगढ़</h1>
              <p className="text-[10px] text-orange-100 opacity-100 font-medium tracking-wider drop-shadow-sm">सेवादार MISSION 2029 (लोकसभा प्रतापगढ़)</p>
            </div>
        </Link>
        
        <div className="flex gap-3 relative z-10">
          <button 
            className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition active:scale-95 shadow-sm" 
            onClick={openNotifications} 
          >
            <Bell size={18} className="text-white drop-shadow-md" />
          </button>
          
          <Link href="/profile" className="relative group active:scale-95 transition">
            <div className={`p-[2px] rounded-full ${profile.photo ? 'bg-white/20' : 'bg-transparent'}`}>
                {profile.photo ? (
                    <img src={profile.photo} alt="Profile" className="w-7 h-7 rounded-full object-cover shadow-sm" />
                ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white shadow-sm">
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