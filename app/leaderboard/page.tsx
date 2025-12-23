'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Crown, User } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data: topUsers } = await supabase
      .from('profiles')
      .select('id, full_name, village, avatar_url, points')
      .eq('is_admin', false)
      .order('points', { ascending: false })
      .limit(100);
    
    // --- DENSE RANKING LOGIC  ---
    const users = topUsers || [];
    let currentRank = 1;
    
    const rankedUsers = users.map((user, index) => {
        if (index > 0 && user.points < users[index - 1].points) {
            currentRank++; 
        }
        return { ...user, ranking: currentRank };
    });

    setLeaders(rankedUsers);

    // My Rank
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const myData = rankedUsers.find(u => u.id === user.id);
      if (myData) setMyRank(myData);
    }
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-neutral-100 pt-safe pb-24 font-sans">
      
      {/* Header */}
      <div className="bg-primary p-6 pb-8 rounded-b-[2rem] shadow-lg relative overflow-hidden mb-4">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
         <div className="relative z-10 text-center text-white">
            <h1 className="text-2xl font-bold font-hindi flex items-center justify-center gap-2">
               <Crown className="fill-white" /> टॉप सेवादार
            </h1>
            <p className="text-orange-100 text-xs mt-1">Top Contributors of Mission 2029</p>
         </div>
      </div>

      {/* 1. MY RANK (At Top Now) */}
      {myRank && (
          <div className="px-4 mb-6 -mt-6 relative z-20">
              <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border-2 border-white">
                  <div className="font-bold text-yellow-400 w-8 text-center text-xl">#{myRank.ranking}</div>
                  <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shrink-0 bg-gray-800">
                        {myRank.avatar_url ? (
                            <img src={myRank.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <User className="p-3 w-full h-full text-gray-400" />
                        )}
                  </div>
                  <div className="flex-1">
                      <h4 className="font-bold text-lg">Your Rank</h4>
                      <p className="text-xs text-gray-400">Keep earning points!</p>
                  </div>
                  <div className="text-yellow-400 font-bold text-xl">{myRank.points}</div>
              </div>
          </div>
      )}

      {/* 2. SIMPLE LIST (Rank 1 to 50) */}
      <div className="px-3 space-y-2">
         {leaders.map((user) => (
            <div key={user.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className={`font-bold w-8 text-center text-sm ${user.ranking <= 3 ? 'text-orange-500 text-lg' : 'text-gray-400'}`}>
                    #{user.ranking}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <User className="p-2 w-full h-full text-gray-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate font-hindi">{user.full_name}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{user.village || 'Active Member'}</p>
                </div>
                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">
                    {user.points} <span className="text-[10px] opacity-70">pts</span>
                </div>
            </div>
         ))}
      </div>

    </div>
  );
}