'use client';
import Link from "next/link";
import { ChevronRight, Download, MapPin } from "lucide-react";
import Header from "@/components/Header";
import PollWidget from '@/components/PollWidget';
import HomeLeaderboard from '@/components/HomeLeaderboard';
import { useProfile } from '@/components/ProfileContext';
import QuizWidget from '@/components/QuizWidget';
import SuggestionBox from '@/components/SuggestionBox';

// Helper component for bottom grid
function InfoCard({ title, count, color, icon, link }: any) {
    return (
      <Link href={link} target="_blank" className={`${color} text-white p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:scale-[1.05] transition-transform`}>
        <div className="relative z-10">
          <div className="text-3xl font-bold mb-1">{count}</div>
          <div className="text-sm opacity-90 font-hindi">{title}</div>
        </div>
        <div className="absolute -bottom-2 -right-2 text-5xl opacity-20 group-hover:scale-110 transition-transform">{icon}</div>
      </Link>
    );
}

export default function HomeContent({ todaysPosters, upcomingPosters, generalPosters }: any) {
  const { profile } = useProfile();

  // Login Guard Function
  const handleProtectedClick = (e: React.MouseEvent, url: string) => {
     if (!profile.name) {
         e.preventDefault();
         window.dispatchEvent(new Event('open-auth'));
     }
  };

  return (
    <main className="min-h-screen bg-neutral-100 pt-24 pb-28 font-sans text-gray-800">
      <Header />

      <div className="p-4 space-y-10">
        
        {/* --- 1. HERO SECTION (Today's Posters) --- */}
        {todaysPosters.length > 0 ? (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
              <h2 className="text-xl font-bold text-gray-800 font-hindi">आज का विशेष</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {todaysPosters.map((poster: any) => (
                <div key={poster.id} className="min-w-[85%] sm:min-w-[350px] snap-center bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative group">
                  <img src={poster.image} alt={poster.title} className="w-full aspect-[9/16] object-cover" onError={(e) => (e.currentTarget.src = '/placeholder.jpg')} />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white pt-20">
                    <h3 className="text-2xl font-bold font-hindi leading-tight">{poster.title}</h3>
                    <p className="text-sm opacity-90 mb-3">{poster.date}</p>
                    <Link href={`/create/${poster.id}`} onClick={(e) => handleProtectedClick(e, '')} className="w-full bg-gradient-to-r from-primary to-primary-dark py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                      <Download size={18} /> कार्ड बनाएं
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-blue-600 to-cyan-400 p-6 text-white shadow-xl shadow-blue-200 border-t border-white/20">
            <div className="flex flex-col justify-between gap-4">
              <div>
                <div className="mb-3 opacity-95 flex items-baseline gap-2">
                  <h2 className="text-5xl font-extrabold tracking-tight">
                    {new Date().toLocaleDateString('hi-IN', { day: 'numeric' })}
                  </h2>
                  <p className="text-lg font-semibold text-blue-50">
                    {new Date().toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <h3 className="text-xl font-bold font-hindi leading-snug drop-shadow-md">
                  आज कोई विशेष त्योहार नहीं है
                </h3>
                <p className="text-blue-100 text-sm font-medium mt-0.5">
                  आने वाले त्योहारों की सूची देखें
                </p>
              </div>
              <div className="flex justify-end mt-1">
                <Link href="/all-posters" onClick={(e) => handleProtectedClick(e, '/all-posters')} className="group inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-blue-600 rounded-full text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors">
                    सभी देखें 
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. GENERAL POSTERS --- */}
        <section>
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xl font-bold text-gray-800 font-hindi">विचार और संकल्प</h2>
            <span className="text-xs text-primary font-bold">Scroll →</span>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 snap-x hide-scrollbar">
            {generalPosters.map((poster: any) => (
              <Link key={poster.id} href={`/create/${poster.id}`} onClick={(e) => handleProtectedClick(e, '')} className="min-w-[140px] snap-start block">
                <div className="rounded-xl overflow-hidden shadow-md border border-gray-100 relative aspect-[9/16] active:scale-95 transition-transform">
                  <img src={poster.image} alt="General" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm">
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- 3. UPCOMING FESTIVALS --- */}
        <section>
          <div className="flex justify-between items-center mb-5 px-1">
              <h2 className="text-xl font-bold text-gray-800 font-hindi">आगामी त्योहार</h2>
              <Link href="/all-posters" onClick={(e) => handleProtectedClick(e, '')} className="text-primary text-sm font-bold">More</Link>
          </div>

          <div className="space-y-4">
            {upcomingPosters.length > 0 && (
              <Link href={`/create/${upcomingPosters[0].id}`} onClick={(e) => handleProtectedClick(e, '')} className="block group relative h-56 rounded-[2.5rem] overflow-hidden shadow-xl shadow-orange-100 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                <img 
                    src={upcomingPosters[0].image} 
                    className="absolute inset-0 w-full h-full object-cover object-[center_17%] transition-transform duration-700 group-hover:scale-105" 
                    alt={upcomingPosters[0].title} 
                />
                <div className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  Upcoming
                </div>
                <div className="absolute bottom-0 left-0 p-6 z-20 text-white w-full">
                  <p className="text-orange-300 text-sm font-bold mb-1 tracking-wide">{upcomingPosters[0].date}</p>
                  <div className="flex justify-between items-end">
                    <h4 className="text-3xl font-bold font-hindi drop-shadow-md">{upcomingPosters[0].title}</h4>
                    <div className="bg-orange-500 p-2.5 rounded-full text-white shadow-lg shadow-orange-500/40 group-hover:scale-110 transition-transform">
                        <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <div className="flex flex-col gap-3">
              {upcomingPosters.slice(1).map((poster: any) => (
                <Link key={poster.id} href={`/create/${poster.id}`} onClick={(e) => handleProtectedClick(e, '')} className="flex items-center gap-4 bg-slate-50 p-2.5 pr-5 rounded-full border border-gray-200 shadow-md hover:shadow-lg hover:bg-white transition-all active:scale-[0.98]">
                  <img src={poster.image} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt={poster.title} />
                  <div className="flex-1 pl-1">
                    <h4 className="font-bold text-gray-800 font-hindi text-lg leading-none mb-1">{poster.title}</h4>
                    <p className="text-xs text-primary font-semibold tracking-wide">{poster.date}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-300 shadow-sm group-hover:text-primary">
                    <ChevronRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 mb-6">
            <QuizWidget />
        </section>
        <PollWidget />

        {/* --- 4. MESSAGE SECTION --- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800 p-8 shadow-xl shadow-purple-200 text-white">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-fuchsia-400 opacity-10 blur-2xl"></div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide mb-4 border border-white/10">
              जनता को संदेश 🙏🏻
            </span>
            <p className="text-xl md:text-2xl font-hindi leading-relaxed font-medium drop-shadow-md mb-6">
              "प्रतापगढ़ का विकास और आपकी सेवा ही मेरा एकमात्र संकल्प है। आइए मिलकर एक नए, सशक्त और विकसित प्रतापगढ़ का निर्माण करें।"
            </p>
            <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10 w-fit ml-auto">
              <div className="text-right">
                <p className="text-base font-bold font-hindi">बृजेश कुमार तिवारी</p>
                <p className="text-xs text-purple-100 font-medium">सेवादार, प्रतापगढ़</p>
              </div>
              <img src="/posters/BT.webp" className="h-12 w-12 rounded-full object-cover border-2 border-white/30" alt="Brijesh Tiwari" />
            </div>
          </div>
        </section>

        <section className="px-4 mb-6">
            <HomeLeaderboard />
        </section>

        {/* --- 5. APNA PRATAPGARH --- */}
        <section id="pratapgarh-section" className="pt-6"> 
        <div className="w-full lg:w-1/2">
          <div className="relative bg-slate-50 rounded-[2.5rem] p-6 mb-6 shadow-lg border border-white/50">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-hindi">अपना प्रतापगढ़</h2>
              <div className="h-1 w-12 bg-primary rounded-full mx-auto mt-2 opacity-60"></div>
            </div>
            <div className="relative rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white bg-white overflow-hidden transform transition hover:scale-[1.02]">
              <img src="/posters/pratapgarh mapnew.webp" alt="Pratapgarh Map" className="w-full h-auto" loading="lazy" />
              <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
            </div>
          </div>
            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-3">
              <InfoCard title="गांव" count="2266" color="bg-orange-500" icon="🏘️" link="https://pratapgarh.nic.in/village/" />
              <InfoCard title="पुलिस स्टेशन" count="22" color="bg-gray-700" icon="🚔" link="https://pratapgarh.nic.in/police-station/" />
              <InfoCard title="नगर पालिका" count="19" color="bg-green-600" icon="🏛️" link="https://pratapgarh.nic.in/public-utility-category/municipality/" />
              <InfoCard title="ब्लॉक" count="17" color="bg-blue-600" icon="🏢" link="https://pratapgarh.nic.in/subdivision-blocks/" />
              <Link href="https://pratapgarh.nic.in/final-published-polling-station-2025/" target="_blank" className="col-span-2 bg-purple-600 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform flex items-center justify-between px-8">
                  <div className="relative z-10">
                    <div className="text-4xl font-bold">2626</div>
                    <div className="text-lg opacity-90 font-hindi">मतदान केंद्र</div>
                  </div>
                  <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform">🗳️</div>
              </Link>
            </div>
          </div>
        </section>

        {/* --- 6. HIGHLIGHTS & MAP --- */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-gray-800 font-hindi">प्रतापगढ़ की झलकियाँ</h3>
            <span className="text-xs font-bold text-primary cursor-pointer">Explore →</span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
            
            <div className="group relative min-w-[85vw] sm:min-w-[320px] h-[400px] rounded-[32px] overflow-hidden snap-center shadow-xl shadow-gray-200/50">
              <img src="/posters/belha devi.webp" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Belha Devi" />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/90 via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/20 text-xl">🛕</div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h4 className="text-2xl font-bold font-hindi mb-2 text-shadow-sm">बेल्हा देवी मंदिर</h4>
                <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed font-hindi">यह पवित्र मंदिर सई नदी के तट पर स्थित है और शहर का एक प्रमुख धार्मिक स्थल है।</p>
              </div>
            </div>

            <div className="group relative min-w-[85vw] sm:min-w-[320px] h-[400px] rounded-[32px] overflow-hidden snap-center shadow-xl shadow-gray-200/50">
              <img src="/posters/mangarhdham.webp" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Mangarh Dham" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/20 text-xl">🕉️</div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h4 className="text-2xl font-bold font-hindi mb-2 text-shadow-sm">मनगढ़ धाम</h4>
                <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed font-hindi">जगद्गुरु कृपालु जी महाराज की जन्मस्थली, मनगढ़ धाम एक भव्य आध्यात्मिक केंद्र है।</p>
              </div>
            </div>
            
            <div className="group relative min-w-[85vw] sm:min-w-[320px] h-[400px] rounded-[32px] overflow-hidden snap-center shadow-xl shadow-gray-200/50">
              <img src="/posters/guisernath.webp" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Ghuisarnath" />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/20 text-xl">🔱</div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h4 className="text-2xl font-bold font-hindi mb-2 text-shadow-sm">घुइसरनाथ धाम</h4>
                <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed font-hindi">यह प्राचीन शिव मंदिर क्षेत्र का एक महत्वपूर्ण तीर्थ स्थल है।</p>
              </div>
            </div>

            <div className="group relative min-w-[85vw] sm:min-w-[320px] h-[400px] rounded-[32px] overflow-hidden snap-center shadow-xl shadow-gray-200/50">
              <img src="/posters/ghantaghar.webp" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Ghantaghar" />
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/20 text-xl">🕐</div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h4 className="text-2xl font-bold font-hindi mb-2 text-shadow-sm">घंटाघर</h4>
                <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed font-hindi">प्रतापगढ़ के केंद्र में स्थित, घंटाघर शहर की एक ऐतिहासिक पहचान है।</p>
              </div>
            </div>
            
          </div>
        </section>

        {/* --- SUGGESTION BOX --- */}
        <section className="mt-8">
            <SuggestionBox />
        </section>

        <section className="relative h-72 rounded-[2rem] overflow-hidden shadow-lg border border-gray-200 group">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d415816.82272288215!2d81.87967745!3d25.8765356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399a941cc3f84783%3A0x110b5a9b38a55b52!2sPratapgarh%2C%20Uttar%20Pradesh!5e1!3m2!1sen!2sin!4v1766336202041!5m2!1sen!2sin" 
            className="w-full h-full border-0 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50 z-10">
            <h3 className="text-sm font-bold text-gray-800 font-hindi flex items-center gap-1.5">
              <MapPin size={16} className="text-red-500 fill-red-500" />
              Location
            </h3>
            <p className="text-[10px] text-gray-500 font-bold ml-5">प्रतापगढ़, उत्तर प्रदेश</p>
          </div>
          <a href="https://maps.app.goo.gl/JKg7NJxv5wNB3hsQ6" target="_blank" className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform z-10">
            दिशा देखें 
          </a>
        </section>

        {/* --- 8. FOOTER --- */}
        <div className="pt-8 pb-0 border-t border-gray-200 mt-10">
           <div style={{fontFamily: 'Arial, sans-serif', textAlign: 'center'}}>
             <a href="https://www.utarts.in" target="_blank" rel="noopener noreferrer" style={{display: 'block', textDecoration: 'none', color: '#888', fontSize: '12px'}}>
                <img src="https://utarts.in/images/poweredbyutarts.webp" alt="Powered by UT Arts" style={{display: 'block', marginLeft: 'auto', marginRight: 'auto', height: '50px', width: 'auto', border: 0, marginBottom: 0, opacity: 0.8}} />
                <br/>visit www.utarts.in
             </a>
           </div>
        </div>

      </div>
    </main>
  );
}