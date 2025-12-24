'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Trophy, ChevronRight, User } from 'lucide-react';
import { useProfile } from './ProfileContext';

export default function HomeLeaderboard() {
  const { profile, t } = useProfile(); 
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTop10() {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, points')
            .eq('is_admin', false)
            .order('points', { ascending: false })
            .limit(10);
        
        if (data) {
            let currentRank = 1;
            const ranked = data.map((u, i) => {
                if (i > 0 && u.points < data[i-1].points) {
                    currentRank++; 
                }
                return { ...u, ranking: currentRank };
            });
            setLeaders(ranked);
        }
    }
    fetchTop10();
  }, []);

  const handleLink = (e: any) => {
    if (!profile.name && !profile.is_admin) {
        e.preventDefault();
        window.dispatchEvent(new Event('open-auth'));
    }
  };

  if (leaders.length === 0) return null;

  return (
    // Tighter padding (p-4 instead of p-6) to maximize width
    <div className="bg-white p-4 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100/50">
       
       {/* Header: Reduced bottom margin (mb-3) */}
       <div className="flex justify-between items-center mb-3 px-1">
           <div className="flex items-center gap-2">
               <div className="bg-yellow-50 p-1.5 rounded-full border border-yellow-100">
                   <Trophy size={16} className="text-yellow-600 fill-yellow-500" />
               </div>
               <h3 className="font-bold text-gray-900 font-hindi tracking-tight">
                   {t.top_sevadar}
               </h3>
           </div>
           
           {/* Compact 'View All' pill */}
           <Link 
                href="/leaderboard" 
                onClick={handleLink} 
                className="group flex items-center gap-0.5 pl-2.5 pr-1.5 py-1 rounded-full bg-gray-50 text-[11px] font-bold text-gray-500 hover:bg-primary/5 hover:text-primary transition-colors"
            >
               {t.view_all} 
               <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
           </Link>
       </div>

       {/* List: Reduced vertical space (space-y-1) */}
       <div className="space-y-0.5">
           {leaders.map((user) => (
               <div 
                key={user.id} 
                // GAP REDUCTION: Changed gap-4 to gap-2.5 to bring elements closer
                className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
               >
                   {/* Rank: Reduced width (w-5) and font size */}
                   <div className={`w-5 text-center font-bold text-sm ${
                       user.ranking === 1 ? 'text-yellow-500' : 
                       user.ranking === 2 ? 'text-gray-400' : 
                       user.ranking === 3 ? 'text-orange-400' : 'text-gray-300'
                   }`}>
                       #{user.ranking}
                   </div>
                   
                   {/* Avatar: Slightly smaller (w-9 h-9) to save horizontal space */}
                   <div className={`w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-sm ${
                       user.ranking === 1 ? 'ring-2 ring-yellow-100 ring-offset-1' : ''
                   }`}>
                       {user.avatar_url ? (
                           <img src={user.avatar_url} className="w-full h-full object-cover"/>
                        ) : (
                           <User className="p-1.5 w-full h-full text-gray-400"/>
                        )}
                   </div>
                   
                   {/* Name: flex-1 ensures it takes all remaining space */}
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <div className="text-[13px] leading-tight font-bold text-gray-700 truncate font-hindi group-hover:text-gray-900">
                           {user.full_name}
                       </div>
                   </div>
                   
                   {/* Points: More compact padding (px-2.5) */}
                   <div className="text-xs font-bold text-orange-600 bg-orange-50/80 px-2.5 py-1 rounded-full border border-orange-100/50 min-w-[32px] text-center">
                       {user.points}
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
}