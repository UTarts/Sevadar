import { getTodaysPosters, getUpcomingPosters, getGeneralPosters } from "@/lib/posters";
import Link from "next/link";
import { ChevronRight, Download, MapPin } from "lucide-react";
import Header from "@/components/Header";

export default async function Home() {
  const todaysPosters = await getTodaysPosters();
  const upcomingPosters = await getUpcomingPosters();
  const generalPosters = await getGeneralPosters();

  return (
    <main className="min-h-screen bg-neutral-100 pt-24 pb-28 font-sans text-gray-800">
      <Header />

      <div className="p-4 space-y-10">
        
        {/* --- 1. HERO --- */}
        {todaysPosters.length > 0 ? (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
              <h2 className="text-xl font-bold text-gray-800 font-hindi">आज का विशेष</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {todaysPosters.map((poster) => (
                <div key={poster.id} className="min-w-[85%] sm:min-w-[350px] snap-center bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative group">
                  <img src={poster.image} alt={poster.title} className="w-full aspect-[9/16] object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white pt-20">
                    <h3 className="text-2xl font-bold font-hindi leading-tight">{poster.title}</h3>
                    <p className="text-sm opacity-90 mb-3">{poster.date}</p>
                    <Link href={`/create/${poster.id}`} className="w-full bg-gradient-to-r from-primary to-primary-dark py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                      <Download size={18} /> कार्ड बनाएं
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-gradient-to-br from-primary-light to-white p-6 rounded-3xl shadow-inner text-center border border-primary/20">
            <h3 className="text-lg font-bold text-primary-dark font-hindi">आज कोई विशेष त्योहार नहीं है</h3>
            <p className="text-sm text-gray-600 mb-4">आने वाले त्योहारों की सूची देखें</p>
            <Link href="/all-posters" className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-md hover:bg-primary-dark transition-colors">
                सभी देखें <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* --- 2. GENERAL POSTERS --- */}
        <section>
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xl font-bold text-gray-800 font-hindi">विचार और संकल्प</h2>
            <span className="text-xs text-primary font-bold">Scroll →</span>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 snap-x hide-scrollbar">
            {generalPosters.map((poster) => (
              <Link key={poster.id} href={`/create/${poster.id}`} className="min-w-[140px] snap-start block">
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

        {/* --- 3. UPCOMING --- */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-800 font-hindi">आगामी त्योहार</h2>
             <Link href="/all-posters" className="text-primary text-sm font-bold flex items-center">
               सभी देखें <ChevronRight size={16} />
             </Link>
          </div>
          <div className="space-y-3">
            {upcomingPosters.map((poster) => (
              <Link key={poster.id} href={`/create/${poster.id}`} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center active:scale-[0.98] transition-transform">
                <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <img src={poster.image} className="w-full h-full object-cover" alt={poster.title} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 font-hindi text-lg">{poster.title}</h4>
                  <p className="text-sm text-primary font-medium">{poster.date}</p>
                </div>
                <div className="p-3 bg-neutral-100 rounded-full text-primary">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- 4. MESSAGE --- */}
        <section className="bg-white rounded-3xl p-6 shadow-lg border-l-4 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -mr-10 -mt-10"></div>
          <h3 className="font-bold text-xl text-primary-dark font-hindi mb-3">जनता को संदेश</h3>
          <div className="relative z-10">
            <p className="text-gray-700 leading-relaxed text-lg italic font-hindi">
              "प्रतापगढ़ का विकास और आपकी सेवा ही मेरा एकमात्र संकल्प है। आइए मिलकर एक नए, सशक्त और विकसित प्रतापगढ़ का निर्माण करें।"
            </p>
            <div className="mt-4 flex justify-end items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-gray-900 font-hindi">बृजेश कुमार तिवारी</p>
                <p className="text-xs text-primary font-bold">सेवादार, प्रतापगढ़</p>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
                <img src="/posters/BT.webp" className="w-full h-full object-cover" alt="Brijesh Tiwari" />
              </div>
            </div>
          </div>
        </section>

        {/* --- 5. APNA PRATAPGARH --- */}
        <section id="pratapgarh-section" className="pt-6"> 
          <h2 className="text-2xl font-bold text-gray-800 font-hindi mb-6 text-center">अपना प्रतापगढ़</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/2">
              <div className="bg-white p-2 rounded-3xl shadow-lg border border-gray-100">
                <img src="/posters/pratapgarh mapnew.webp" alt="Pratapgarh Map" className="w-full h-auto rounded-2xl" />
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

        {/* --- 6. GLIMPSES --- */}
        <section>
          <h3 className="text-xl font-bold text-gray-800 font-hindi mb-5">प्रतापगढ़ की झलकियाँ</h3>
          <div className="space-y-6">
            <LandmarkCard 
              title="बेल्हा देवी मंदिर" 
              desc="यह पवित्र मंदिर सई नदी के तट पर स्थित है और शहर का एक प्रमुख धार्मिक स्थल है।"
              image="/posters/belha devi.webp"
              icon="🛕"
              color="bg-orange-500"
            />
            <LandmarkCard 
              title="मनगढ़ धाम" 
              desc="जगद्गुरु कृपालु जी महाराज की जन्मस्थली, मनगढ़ धाम एक भव्य और शांतिपूर्ण आध्यात्मिक केंद्र है।"
              image="/posters/mangarhdham.webp"
              icon="🕉️"
              color="bg-purple-500"
              reverse
            />
            <LandmarkCard 
              title="घुइसरनाथ धाम" 
              desc="यह प्राचीन शिव मंदिर क्षेत्र का एक महत्वपूर्ण तीर्थ स्थल है, जहाँ भक्तों का तांता लगा रहता है।"
              image="/posters/guisernath.webp"
              icon="🔱"
              color="bg-green-600"
            />
            <LandmarkCard 
              title="घंटाघर" 
              desc="प्रतापगढ़ के केंद्र में स्थित, घंटाघर शहर की एक ऐतिहासिक पहचान है।"
              image="/posters/ghantaghar.webp"
              icon="🕐"
              color="bg-red-500"
              reverse
            />
          </div>
        </section>

        {/* --- 7. LOCATION MAP --- */}
        <section className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 font-hindi mb-4 flex items-center gap-2">
                <MapPin className="text-red-500" />
                प्रतापगढ़, उ.प्र. (Location)
            </h3>
            <div className="w-full h-64 rounded-2xl overflow-hidden bg-gray-100">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d114964.53925916665!2d81.9315752!3d25.9268351!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990861111622f99%3A0x264969242d99d2e7!2sPratapgarh%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1709664560384!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </section>

        {/* --- 8. FOOTER --- */}
        <div className="pt-8 pb-0 border-t border-gray-200 mt-10">
           <div style={{fontFamily: 'Arial, sans-serif', textAlign: 'center'}}>
             <a href="https://www.utarts.in" target="_blank" rel="noopener noreferrer" style={{display: 'block', textDecoration: 'none', color: '#888', fontSize: '12px'}}>
                <img src="https://utarts.in/images/poweredbyutarts.webp" alt="Powered by UT Arts" style={{display: 'block', marginLeft: 'auto', marginRight: 'auto', height: '60px', width: 'auto', border: 0, marginBottom: 0, opacity: 0.8}} />
                <br/>visit www.utarts.in
             </a>
           </div>
        </div>

      </div>
    </main>
  );
}

// Helpers...
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

function LandmarkCard({ title, desc, image, icon, color, reverse }: any) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-4 bg-white p-3 rounded-2xl shadow-md border border-gray-100`}>
      <div className="w-full md:w-1/2 relative h-48 rounded-xl overflow-hidden shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
        <div className={`absolute top-2 left-2 ${color} text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-sm">{icon}</span>
        </div>
      </div>
      <div className="w-full md:w-1/2 p-2">
        <h4 className="text-xl font-bold font-hindi text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}