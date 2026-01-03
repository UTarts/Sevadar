'use client';
import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const YOUTUBE_VIDEO_ID = "QCf3qXhExoo"; 

export default function VideoWidget() {
  const [mode, setMode] = useState<'hidden' | 'minimized' | 'expanded'>('hidden');

  useEffect(() => {
    // 1. Check Permanent Storage (First time ever?)
    const hasSeenIntro = localStorage.getItem('mission2029_intro_seen');
    
    // 2. Check Session Storage (Is app currently open?)
    const sessionActive = sessionStorage.getItem('mission2029_session_active');

    if (!hasSeenIntro) {
      // First Install: Show Big
      setMode('expanded');
      localStorage.setItem('mission2029_intro_seen', 'true');
      sessionStorage.setItem('mission2029_session_active', 'true');
    } else if (!sessionActive) {
      // New Open: Show Small
      setMode('minimized');
      sessionStorage.setItem('mission2029_session_active', 'true');
    } else {
      // Navigating: Hide
      setMode('hidden');
    }
  }, []);

  if (mode === 'hidden') return null;

  return (
    <>
      {/* --- EXPANDED MODE (Vertical Modal) --- */}
      {mode === 'expanded' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          {/* Max width restricted for vertical look */}
          <div className="relative w-full max-w-[350px] bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4 bg-gradient-to-b from-black/60 to-transparent">
                <span className="font-hindi font-bold text-white text-sm drop-shadow-md">वेबसाईट के बारे मे सम्पूर्ण जानकारी</span>
                <button onClick={() => setMode('minimized')} className="p-1.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40">
                    <X size={18} />
                </button>
            </div>
            
            {/* Vertical Video Container (Aspect 9:16) */}
            <div className="aspect-[9/16] bg-black">
              <iframe 
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&controls=0&loop=1&playlist=${YOUTUBE_VIDEO_ID}`}
                className="w-full h-full" 
                allow="autoplay; encrypted-media" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* --- MINIMIZED MODE (Vertical Corner Popup) --- */}
      {mode === 'minimized' && (
        <div className="fixed bottom-24 right-4 z-[90] animate-in slide-in-from-right duration-700">
          <div className="relative group shadow-2xl">
            {/* Close Button */}
            <button 
              onClick={() => setMode('hidden')}
              className="absolute -top-2 -left-2 bg-red-600 text-white p-1.5 rounded-full shadow-md z-20 hover:scale-110 transition-transform"
            >
              <X size={12} strokeWidth={3} />
            </button>

            {/* Thumbnail Card (Vertical) */}
            <div 
              onClick={() => setMode('expanded')}
              className="w-24 aspect-[9/16] bg-white rounded-xl overflow-hidden border-2 border-white cursor-pointer hover:scale-105 transition-transform shadow-lg"
            >
              <div className="w-full h-full bg-black relative">
                 <img 
                    src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/mqdefault.jpg`} 
                    className="w-full h-full object-cover opacity-90" 
                 />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
                        <Play size={14} className="text-white fill-white ml-0.5" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}