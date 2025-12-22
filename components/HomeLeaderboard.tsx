'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Trophy, ChevronRight, User } from 'lucide-react';
import { useProfile } from './ProfileContext';

export default function HomeLeaderboard() {
  const { profile } = useProfile(); 
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTop10() {
        // Fetch Top 10 Users (Excluding Admins)
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, points')
            .eq('is_admin', false)
            .order('points', { ascending: false })
            .limit(10); // <--- Top 10
        
        if (data) {
            // Add ranking numbers manually
            const ranked = data.map((u, i) => ({ ...u, ranking: i + 1 }));
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
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
       <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-gray-800 font-hindi flex items-center gap-2">
               <Trophy size={18} className="text-yellow-500 fill-yellow-500" /> टॉप सेवादार
           </h3>
           <Link href="/leaderboard" onClick={handleLink} className="text-xs font-bold text-primary flex items-center">
               View All <ChevronRight size={14} />
           </Link>
       </div>

       <div className="space-y-3">
           {leaders.map((user) => (
               <div key={user.id} className="flex items-center gap-3">
                   <div className={`w-6 text-center font-bold text-xs ${user.ranking === 1 ? 'text-yellow-600' : 'text-gray-400'}`}>
                       #{user.ranking}
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                       {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <User className="p-1.5 w-full h-full text-gray-400"/>}
                   </div>
                   <div className="flex-1 min-w-0">
                       <div className="text-sm font-bold text-gray-800 truncate font-hindi">{user.full_name}</div>
                   </div>
                   <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                       {user.points}
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
}