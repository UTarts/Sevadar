'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, ChevronRight, ChevronDown, ArrowLeft, Filter } from 'lucide-react';
import { useProfile } from '@/components/ProfileContext';

// --- SKELETON COMPONENT (For Loading State) ---
const PosterSkeleton = () => (
  <div className="flex flex-col gap-2 animate-pulse">
    <div className="relative aspect-[9/16] bg-gray-200 rounded-2xl overflow-hidden border border-gray-100"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
  </div>
);

export default function AllPostersPage() {
  const { t, language } = useProfile(); // Use global language context
  const [posters, setPosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [visibleCount, setVisibleCount] = useState(12);

  // 1. Fetch Data
  useEffect(() => {
    fetch('/data/posters.json')
      .then(res => res.json())
      .then(data => {
          setPosters(data);
          setLoading(false);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  // 2. Date Logic
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 3. Dictionary for Dynamic Content (Poster Titles)
  const englishToHindiMap: Record<string, string> = {
    "diwali": "दीपावली",
    "deepawali": "दीपावली",
    "holi": "होली",
    "new year": "नववर्ष",
    "republic day": "गणतंत्र दिवस",
    "independence day": "स्वतंत्रता दिवस",
    "makar sankranti": "मकर संक्रांति",
    "christmas": "क्रिसमस",
    "eid": "ईद",
    "raksha bandhan": "रक्षा बंधन",
    "dussehra": "दशहरा",
    "navratri": "नवरात्रि",
    "janmashtami": "जन्माष्टमी",
    "ganesh chaturthi": "गणेश चतुर्थी"
  };

  const translateTitle = (title: string) => {
    if (language === 'en') return title;
    const lowerTitle = title.toLowerCase();
    for (const key in englishToHindiMap) {
      if (lowerTitle.includes(key)) {
        return title.replace(new RegExp(key, 'gi'), englishToHindiMap[key]);
      }
    }
    return title; // Fallback to original
  };

  // 4. Filtering & Sorting Logic
  const filteredPosters = useMemo(() => {
    let result = posters;

    // A. Filter by Search
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerFilter) || 
        (p.date && p.date.includes(lowerFilter))
      );
    }

    // B. Filter by Category
    if (category === 'upcoming') {
      result = result.filter(p => {
        if (!p.date) return false;
        return parseDate(p.date) >= today;
      }).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    } else if (category === 'past') {
      result = result.filter(p => {
        if (!p.date) return false;
        return parseDate(p.date) < today;
      }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()); // Most recent past first
    } else {
       // All: Sort by Priority first, then Date
       result = [...result].sort((a, b) => {
           // Put "dated" posters before "general"
           if (a.type === 'dated' && b.type === 'general') return -1;
           if (a.type === 'general' && b.type === 'dated') return 1;
           return 0;
       });
    }

    return result;
  }, [posters, filter, category, language]);

  const visiblePosters = filteredPosters.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* --- FIXED HEADER SECTION --- */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
         
         {/* Top Bar */}
         <div className="flex items-center gap-3 p-4 pt-safe pb-2">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition active:scale-95">
               <ArrowLeft size={24} className="text-gray-700" />
            </Link>
            <h1 className="text-xl font-bold font-hindi text-gray-800">{t.gallery_title}</h1>
         </div>

         {/* Search Bar */}
         <div className="px-4 pb-3">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder={t.search_placeholder} 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-primary/50 text-gray-800 rounded-2xl py-3 pl-10 pr-4 outline-none transition-all shadow-inner focus:shadow-lg text-sm font-medium"
                />
            </div>
         </div>

         {/* Tab Navigation (Pills) */}
         <div className="px-4 pb-4 overflow-x-auto hide-scrollbar">
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                {[
                  { id: 'upcoming', label: t.tab_upcoming },
                  { id: 'all', label: t.tab_all },
                  { id: 'past', label: t.tab_past }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setCategory(tab.id as any); setVisibleCount(12); }}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                        category === tab.id 
                        ? 'bg-white text-primary shadow-md scale-105' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>
         </div>
      </div>

      {/* --- MAIN GRID CONTENT --- */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {loading ? (
             // SKELETON LOADING STATE
             Array.from({ length: 8 }).map((_, i) => <PosterSkeleton key={i} />)
          ) : visiblePosters.length > 0 ? (
             // ACTUAL POSTERS
             visiblePosters.map((poster) => (
              <Link 
                key={poster.id} 
                href={`/create/${poster.id}`} 
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform duration-200 hover:shadow-lg"
              >
                  <div className="relative aspect-[9/16] bg-gray-100 overflow-hidden">
                      {/* OPTIMIZED IMAGE: Low Quality for Grid (60%) */}
                      <Image 
                        src={poster.image} 
                        alt={poster.title} 
                        fill
                        quality={60} // Low quality for speed
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />

                      {/* Date Badge */}
                      {poster.date && (
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md flex items-center gap-1 shadow-sm font-bold border border-white/10">
                              <Calendar size={10} /> {poster.date}
                          </div>
                      )}

                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/90 p-2 rounded-full text-primary shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                              <ChevronRight size={20} />
                          </div>
                      </div>
                  </div>
                  
                  {/* Footer Content */}
                  <div className="p-3 bg-white">
                      <h3 className="font-bold text-gray-800 text-sm font-hindi line-clamp-1 leading-snug">
                        {translateTitle(poster.title)}
                      </h3>
                      <div className="flex items-center text-primary text-[10px] font-bold mt-1 uppercase tracking-wide">
                        {t.create_card} <ChevronRight size={12} className="ml-0.5" />
                      </div>
                  </div>
              </Link>
          ))) : (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
                <div className="bg-gray-200 p-4 rounded-full mb-3">
                    <Filter size={32} className="text-gray-400" />
                </div>
                <p className="font-bold text-gray-600 font-hindi">{t.no_results}</p>
                <button onClick={() => {setFilter(''); setCategory('all')}} className="mt-2 text-primary text-sm font-bold underline">
                    Clear Filters
                </button>
             </div>
          )}
        </div>

        {/* Load More Button */}
        {!loading && visibleCount < filteredPosters.length && (
            <div className="mt-8 flex justify-center pb-10">
                <button 
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-full font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all text-sm"
                >
                    {t.load_more} <ChevronDown size={14} />
                </button>
            </div>
        )}
      </div>
    </main>
  );
}