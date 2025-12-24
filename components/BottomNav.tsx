'use client';
import Link from "next/link";
import { Home, LayoutGrid, User, Film, Trophy, LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { useProfile } from "./ProfileContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useProfile(); 
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!profile.name && !profile.is_admin) {
      e.preventDefault();
      window.dispatchEvent(new Event('open-auth'));
    }
  };

  // CHECK FOR NEW POSTS (Last 24 Hours)
  useEffect(() => {
    const checkNewPosts = async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count } = await supabase
            .from('feed_posts')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', yesterday.toISOString());
        
        if (count && count > 0) setHasNewPosts(true);
    };
    checkNewPosts();
  }, []);

  const profileLink = profile.is_admin ? "/admin" : (profile.name ? "/profile" : "#");

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Feed', href: '/feed', icon: Film, hasBadge: hasNewPosts },
    { name: 'Rank', href: '/leaderboard', icon: Trophy },
    { name: 'Gallery', href: '/all-posters', icon: LayoutGrid },
    { 
      name: profile.is_admin ? 'Admin' : (profile.name ? 'Profile' : 'Login'),
      href: profileLink,
      icon: profile.name || profile.is_admin ? User : LogIn,
      onClick: handleProfileClick,
      isProfile: true
    }
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center px-1 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              replace={item.href === '/'} 
              onClick={item.onClick}
              className={`group flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all duration-200 w-14 active:scale-95 touch-manipulation`}
            >
              <div className={`relative p-1 rounded-full transition-all duration-300 ${
                active ? 'bg-orange-50 text-primary -translate-y-0.5' : 'bg-transparent text-gray-400 group-hover:text-gray-600'
              }`}>
                {item.isProfile && profile.photo ? (
                    <div className={`w-5 h-5 rounded-full overflow-hidden border-[1.5px] ${active ? 'border-primary' : 'border-gray-200'}`}>
                        <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} className="transition-transform" />
                )}
                
                {/* RED BADGE FOR FEED */}
                {item.hasBadge && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </div>
              <span className={`text-[9px] font-sans tracking-wide transition-all duration-200 ${
                active ? 'text-primary font-bold opacity-100' : 'text-gray-400 font-normal'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}