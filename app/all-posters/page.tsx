'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Search, Calendar, ChevronRight, Filter } from 'lucide-react';

export default function AllPostersPage() {
  const [posters, setPosters] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<'upcoming' | 'all' | 'past'>('upcoming'); // DEFAULT UPCOMING

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

  const filteredPosters = posters
    .filter(p => {
        // HIDE GENERAL POSTERS from this page entirely
        if (p.type === 'general') return false;

        const matchesSearch = p.title.toLowerCase().includes(filter.toLowerCase()) || 
                              (p.date && p.date.includes(filter));
        if (!matchesSearch) return false;

        const today = new Date();
        today.setHours(0,0,0,0);
        const pDate = p.date ? parseDate(p.date) : null;

        if (category === 'upcoming') return pDate && pDate >= today;
        if (category === 'past') return pDate && pDate < today;
        
        return true; // 'all' shows all dated posters
    })
    .sort((a, b) => {
        // Sort by Date (Ascending for Upcoming, Descending for Past/All)
        const dateA = parseDate(a.date).getTime();
        const dateB = parseDate(b.date).getTime();
        return dateA - dateB; 
    });

  return (
    <div className="min-h-screen bg-neutral-100 pt-24 pb-28 font-sans">
      <Header />
      
      <div className="px-4 mt-2 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative shadow-md rounded-2xl bg-white border border-gray-200">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="तारीख या नाम खोजें..." 
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-transparent focus:ring-2 ring-primary focus:outline-none font-hindi text-gray-800"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setCategory('upcoming')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${category === 'upcoming' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                आगामी (Upcoming)
            </button>
            <button onClick={() => setCategory('all')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${category === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                सभी (All)
            </button>
            <button onClick={() => setCategory('past')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${category === 'past' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                पुराने (Previous)
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredPosters.length > 0 ? filteredPosters.map((poster) => (
              <Link key={poster.id} href={`/create/${poster.id}`} className="block bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[9/16] bg-gray-200 relative">
                      <img src={poster.image} alt={poster.title} className="w-full h-full object-cover" loading="lazy" />
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
      </div>
    </div>
  );
}