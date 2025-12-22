'use client';
import Link from "next/link";
import { Download, Grid, User, Film, Trophy, LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { useProfile } from "./ProfileContext";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { profile, t } = useProfile(); 

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!profile.name && !profile.is_admin) {
      e.preventDefault();
      window.dispatchEvent(new Event('open-auth'));
    }
  };

  // Determine where the profile button leads
  const profileLink = profile.is_admin ? "/admin" : (profile.name ? "/profile" : "#");

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-2 flex justify-around items-center z-50 text-[10px] font-medium text-gray-500 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
      
      <Link href="/" replace={true} className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : ''}`}>
        <Download size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
        <span>{t.home}</span>
      </Link>

      <Link href="/feed" className={`flex flex-col items-center gap-1 ${isActive('/feed') ? 'text-primary' : ''}`}>
        <Film size={24} strokeWidth={isActive('/feed') ? 2.5 : 2} />
        <span>{t.feed}</span>
      </Link>

      <Link href="/leaderboard" className={`flex flex-col items-center gap-1 ${isActive('/leaderboard') ? 'text-primary' : ''}`}>
        <Trophy size={24} strokeWidth={isActive('/leaderboard') ? 2.5 : 2} />
        <span>{t.rank}</span>
      </Link>

      <Link href="/all-posters" className={`flex flex-col items-center gap-1 ${isActive('/all-posters') ? 'text-primary' : ''}`}>
        <Grid size={24} strokeWidth={isActive('/all-posters') ? 2.5 : 2} />
        <span>{t.gallery}</span>
      </Link>

      <Link 
        href={profileLink} 
        onClick={handleProfileClick}
        className={`flex flex-col items-center gap-1 ${isActive(profileLink) ? 'text-primary' : ''}`}
      >
        {profile.name || profile.is_admin ? (
           <>
             <User size={24} strokeWidth={isActive(profileLink) ? 2.5 : 2} />
             <span>{profile.is_admin ? 'Admin' : t.profile}</span>
           </>
        ) : (
           <>
             <LogIn size={24} />
             <span>{t.login}</span>
           </>
        )}
      </Link>

    </nav>
  );
}