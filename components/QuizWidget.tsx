'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from './ProfileContext';
import { HelpCircle, CheckCircle2, XCircle, Trophy, Loader2 } from 'lucide-react';

export default function QuizWidget() {
  const { profile, updateProfile } = useProfile();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [hasPlayed, setHasPlayed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
      fetchDailyQuiz();
  }, [profile.name]);

  const fetchDailyQuiz = async () => {
      try {
          const today = new Date().toISOString().split('T')[0];

          // 1. Fetch Quiz
          const { data: quizData, error } = await supabase
              .from('daily_quizzes')
              .select('*')
              .eq('date', today)
              .single();

          if (error || !quizData) { setLoading(false); return; }
          setQuiz(quizData);

          // --- ADMIN VIEW LOGIC ---
          // Use 'quizData' directly here, NOT 'quiz' state (which is still null)
          if (profile.is_admin) {
              setHasPlayed(true); // Lock the quiz
              setSelected(quizData.correct_index); // Highlight correct answer
              setIsCorrect(true); // Show green
              setLoading(false);
              return; // Stop here for admin
          }

          // 2. Check History (Normal User)
          if (profile.name) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const { data: submission } = await supabase
                      .from('quiz_submissions')
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('quiz_id', quizData.id)
                      .single();

                  if (submission) {
                      setHasPlayed(true);
                      setSelected(submission.selected_index);
                      setIsCorrect(submission.is_correct);
                  }
              }
          }
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const handleOptionClick = async (index: number) => {
      // Admin Check (Double safety)
      if (profile.is_admin) return;

      if (hasPlayed || submitting || !quiz) return;
      
      if (!profile.name) {
        window.dispatchEvent(new Event('open-auth'));
        return;
      }
      
      setSubmitting(true);
      setSelected(index);
      
      const correct = index === quiz.correct_index;
      setIsCorrect(correct);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 3. Save to DB
      const { error } = await supabase.from('quiz_submissions').insert({
          user_id: user.id,
          quiz_id: quiz.id,
          selected_index: index,
          is_correct: correct
      });

      if (!error) {
          setHasPlayed(true);
          if (correct) {
             const newPoints = (profile as any).points ? (profile as any).points + quiz.points : quiz.points;
             updateProfile({ points: newPoints } as any);
          }
      } else {
          if (error.code === '23505') { 
              setHasPlayed(true);
          } else {
              alert(`Error: ${error.message}`);
              setSubmitting(false);
          }
      }
  };

  if (loading) return <div className="h-32 bg-gray-100 rounded-3xl animate-pulse mb-4" />;
  if (!quiz) return null;

  // Render Logic
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden mb-4">
       <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
       
       <div className="relative z-10">
           <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-gray-800 font-hindi flex items-center gap-2">
                   <HelpCircle size={18} className="text-orange-500" /> 
                   {profile.is_admin ? "आज का सवाल (Admin View)" : "आज का सवाल"}
               </h3>
               {!profile.is_admin && (
                   <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg flex items-center gap-1">
                       <Trophy size={10} /> Win {quiz.points} Pts
                   </span>
               )}
           </div>

           <p className="font-hindi font-bold text-lg text-gray-800 mb-4 leading-snug">
               {quiz.question}
           </p>

           <div className="grid grid-cols-1 gap-2">
               {typeof quiz.options === 'string' 
                  ? JSON.parse(quiz.options).map(renderOption)
                  : quiz.options.map(renderOption)
               }
           </div>

           {/* Result Message */}
           {hasPlayed && !profile.is_admin && (
               <div className={`mt-4 text-center text-xs font-bold p-3 rounded-xl animate-in slide-in-from-top-2 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {isCorrect ? `🎉 सही जवाब! आपको ${quiz.points} अंक मिले।` : "❌ गलत जवाब। कल फिर कोशिश करें!"}
               </div>
           )}
       </div>
    </div>
  );

  function renderOption(opt: string, idx: number) {
       let stateStyle = "border-gray-200 bg-white hover:bg-gray-50";
       
       if (selected !== null) {
           if (idx === quiz.correct_index) {
               stateStyle = "border-green-500 bg-green-50 text-green-800";
           } else if (idx === selected && !isCorrect) {
               stateStyle = "border-red-500 bg-red-50 text-red-800";
           } else {
               stateStyle = "border-gray-100 opacity-50";
           }
       }

       return (
           <button 
               key={idx}
               onClick={() => handleOptionClick(idx)}
               disabled={hasPlayed || submitting || profile.is_admin}
               className={`w-full text-left p-3 rounded-xl border-2 font-bold font-hindi transition-all flex justify-between items-center ${stateStyle}`}
           >
               {opt}
               {selected !== null && idx === quiz.correct_index && <CheckCircle2 size={18} className="text-green-600"/>}
               {selected === idx && !isCorrect && <XCircle size={18} className="text-red-600"/>}
               {submitting && selected === idx && <Loader2 size={18} className="animate-spin text-gray-400"/>}
           </button>
       );
  }
}