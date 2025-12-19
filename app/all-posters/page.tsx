'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Search, Calendar, ChevronRight, ChevronDown } from 'lucide-react';

export default function AllPostersPage() {
  const [posters, setPosters] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  
  // PERFORMANCE: Only show this many initially
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    fetch('/data/posters.json')
      .then(res => res.json())
      .then(data => setPosters(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // --- ENGLISH TO HINDI DICTIONARY ---
  const englishToHindiMap: Record<string, string> = {
    "diwali": "दीपावली",
    "deepawali": "दीपावली",
    "holi": "होली",
    "new year": "नववर्ष",
    "republic": "गणतंत्र",
    "independence": "स्वतंत्रता",
    "christmas": "क्रिसमस",
    "eid": "ईद",
    "raksha": "रक्षाबंधन",
    "basant": "बसंत",
    "shivratri": "शिवरात्रि",
    "youth": "युवा",
    "army": "सेना",
    "navratri": "नवरात्रि",
    "dussehra": "दशहरा"
  };

  const filteredPosters = posters
    .filter(p => {
        // 1. Hide General Posters from Gallery
        if (p.type === 'general') return false;

        // 2. Advanced Search Logic
        const searchLower = filter.toLowerCase();
        
        // Check if english input matches a hindi festival key
        let hindiTerm = "";
        Object.keys(englishToHindiMap).forEach(key => {
            if (searchLower.includes(key)) hindiTerm = englishToHindiMap[key];
        });

        const matchesSearch = p.title.toLowerCase().includes(searchLower) || 
                              (p.date && p.date.includes(filter)) ||
                              (hindiTerm && p.title.includes(hindiTerm)); // Search by Hindi translation

        if (!matchesSearch) return false;

        // 3. Category Filter
        const today = new Date();
        today.setHours(0,0,0,0);
        const pDate = p.date ? parseDate(p.date) : null;

        if (category === 'upcoming') return pDate && pDate >= today;
        if (category === 'past') return pDate && pDate < today;
        
        return true; 
    })
    .sort((a, b) => {
        // Sort by Date
        const dateA = parseDate(a.date).getTime();
        const dateB = parseDate(b.date).getTime();
        return dateA - dateB; 
    });

  // PERFORMANCE: Slice the data based on visibleCount
  const visiblePosters = filteredPosters.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-neutral-100 pt-24 pb-28 font-sans">
      <Header />
      
      <div className="px-4 mt-2 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative shadow-md rounded-2xl bg-white border border-gray-200">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="खोजें (Search)..." 
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-transparent focus:ring-2 ring-primary focus:outline-none font-hindi text-gray-800"
                value={filter}
                onChange={(e) => {
                    setFilter(e.target.value);
                    setVisibleCount(12); // Reset pagination on search
                }}
            />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => { setCategory('upcoming'); setVisibleCount(12); }} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${category === 'upcoming' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                आगामी (Upcoming)
            </button>
            <button onClick={() => { setCategory('all'); setVisibleCount(12); }} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${category === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                सभी (All)
            </button>
            <button onClick={() => { setCategory('past'); setVisibleCount(12); }} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${category === 'past' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                पुराने (Previous)
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          {visiblePosters.length > 0 ? visiblePosters.map((poster) => (
              <Link key={poster.id} href={`/create/${poster.id}`} className="block bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[9/16] bg-gray-200 relative">
                      {/* PERFORMANCE: loading="lazy" is crucial here */}
                      <img 
                        src={poster.image} 
                        alt={poster.title} 
                        className="w-full h-full object-cover" 
                        loading="lazy" 
                        decoding="async"
                      />
                      {poster.date && (
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md flex items-center gap-1">
                              <Calendar size={10} /> {poster.date}
                          </div>
                      )}
                  </div>
                  <div className="p-3">
                      <h3 className="font-bold text-gray-800 text-sm font-hindi line-clamp-2 h-10 leading-snug">{poster.title}</h3>
                      <div className="flex items-center text-primary text-xs font-bold mt-2">
                        Create <ChevronRight size={14} />
                      </div>
                  </div>
              </Link>
          )) : (
             <div className="col-span-2 text-center py-10 text-gray-500">
                कोई पोस्टर नहीं मिला (No posters found)
             </div>
          )}
        </div>

        {/* Load More Button */}
        {visibleCount < filteredPosters.length && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={loadMore}
                    className="flex items-center gap-2 bg-white text-gray-600 border border-gray-300 px-6 py-2 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-colors"
                >
                    और देखें (Load More) <ChevronDown size={18} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
}