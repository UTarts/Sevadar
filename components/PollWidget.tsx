'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart2, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useProfile } from './ProfileContext';

interface Poll {
  id: number;
  question: string;
  options: string[]; // Fixed: Now an Array
  votes: number[];   // Fixed: Now an Array
}

export default function PollWidget() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votedOptionIdx, setVotedOptionIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { profile, updateProfile } = useProfile();

  useEffect(() => {
    fetchLatestPoll();
  }, [profile.name]);

  async function fetchLatestPoll() {
    try {
      const { data: polls } = await supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (polls && polls.length > 0) {
        // Force Type Cast to handle DB changes safely
        setPoll(polls[0] as any);
        if (!profile.is_admin) {
            checkIfUserVoted(polls[0].id);
        }
      } else {
        setLoading(false);
      }
    } catch (e) { console.error(e); setLoading(false); }
  }

  async function checkIfUserVoted(pollId: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('poll_submissions')
        .select('selected_option')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();
      
      if (data) setVotedOptionIdx(parseInt(data.selected_option));
    }
    setLoading(false);
  }

  const handleVote = async (index: number) => {
    // 1. Admin Block
    if (profile.is_admin) return;

    if (!poll) return;
    setSubmitting(true);

    // 2. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.dispatchEvent(new Event('open-auth')); 
      setSubmitting(false);
      return;
    }

    // 3. Submit via SQL Function
    const { error } = await supabase.rpc('submit_vote', {
      p_poll_id: poll.id,
      p_option_index: index
    });

    if (error) {
      if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
        alert("आप पहले ही वोट दे चुके हैं (You already voted!)");
        setVotedOptionIdx(index); 
      } else {
        alert("Error voting. Please try again.");
      }
    } else {
      setVotedOptionIdx(index);
      
      if (!votedOptionIdx) {
          const newPoints = (profile.points || 0) + 5;
          updateProfile({ points: newPoints });
      }

      // Optimistic Update
      const newVotes = [...(poll.votes || [])];
      newVotes[index] = (newVotes[index] || 0) + 1;
      setPoll({ ...poll, votes: newVotes });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />;
  if (!poll || !poll.options || poll.options.length === 0) return null;

  // Calculate Totals
  const totalVotes = poll.votes ? poll.votes.reduce((a, b) => a + b, 0) : 0;
  const getPercent = (count: number) => totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
            <BarChart2 className="text-primary" size={20} />
            <h3 className="font-bold text-gray-800 font-hindi text-lg">
                {profile.is_admin ? "जनता की राय (Admin View)" : "जनता की राय (Live Poll)"}
            </h3>
        </div>
        {profile.is_admin && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Users size={12}/> Total: {totalVotes}
            </span>
        )}
      </div>

      <h4 className="text-xl font-bold font-hindi text-gray-900 mb-6 leading-snug">{poll.question}</h4>

      {/* Options List */}
      <div className="space-y-3 relative z-10">
        {poll.options.map((optionText, idx) => {
          const voteCount = poll.votes ? (poll.votes[idx] || 0) : 0;
          const percent = getPercent(voteCount);
          const isSelected = votedOptionIdx === idx;
          const showStats = votedOptionIdx !== null || profile.is_admin;

          return (
            <button
              key={idx}
              onClick={() => !showStats && handleVote(idx)}
              disabled={showStats || submitting}
              className={`relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden group ${
                isSelected 
                  ? 'border-green-500 bg-green-50' 
                  : showStats
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-primary hover:bg-orange-50'
              }`}
            >
              {/* Progress Bar Background */}
              {showStats && (
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isSelected ? 'bg-green-200/50' : 'bg-gray-200/50'}`} 
                  style={{ width: `${percent}%` }} 
                />
              )}

              <div className="relative flex justify-between items-center z-10 px-1">
                <span className={`font-hindi font-bold text-sm ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                  {optionText}
                </span>
                
                {/* Stats Section */}
                {showStats && (
                  <div className="text-right">
                      <span className="text-xs font-bold text-gray-800 block">{percent}%</span>
                      {profile.is_admin && (
                          <span className="text-[10px] text-gray-500 font-medium">({voteCount} votes)</span>
                      )}
                  </div>
                )}

                {!showStats && submitting && <Loader2 size={16} className="animate-spin text-gray-400" />}
              </div>
            </button>
          );
        })}
      </div>
      
      {votedOptionIdx !== null && !profile.is_admin && (
        <div className="mt-4 text-center text-xs text-green-600 font-bold flex items-center justify-center gap-1 animate-in fade-in slide-in-from-bottom">
           <CheckCircle2 size={14} /> वोट देने के लिए धन्यवाद! (+5 Points Added)
        </div>
      )}
    </div>
  );
}