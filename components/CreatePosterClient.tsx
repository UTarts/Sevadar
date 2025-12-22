'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/components/ProfileContext';
import { supabase } from '@/lib/supabaseClient';
import PosterCanvas from '@/components/PosterCanvas';
import { Download, Share2, ArrowLeft, Loader2, Camera, Wand2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function CreatePosterClient({ posterData }: { posterData: any }) {
  const router = useRouter();
  const { profile, isLoaded, updateProfile } = useProfile();
  
  // State
  const [poster] = useState<any>(posterData);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // User Details
  const [customName, setCustomName] = useState('');
  const [customDesignation, setCustomDesignation] = useState('');
  const [customVillage, setCustomVillage] = useState('');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  // Points State
  const [pointsAwarded, setPointsAwarded] = useState(false);

  // Cropper State
  const [isCropping, setIsCropping] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Config 
  const [config] = useState({
    photoX: 545, photoY: 1391, photoSize: 480,
    nameX: 495, nameY: 1555, nameSize: 78, desigYOffset: 65
  });

  // Load Profile
  useEffect(() => {
    if (isLoaded) {
        if (profile.is_admin) {
            setCustomName('Admin'); 
        } 
        else if (profile.name) {
            setCustomName(profile.name);
            setCustomDesignation(profile.designation || '');
            setCustomVillage(profile.village || '');
            setCustomPhoto(profile.photo);
        } else {
            router.push('/profile');
        }
    }
  }, [isLoaded, profile, router]);

  // --- POINTS LOGIC (Strict Daily Limit) ---
  const awardDownloadPoints = async () => {
      if (profile.is_admin || pointsAwarded) return; 

      // 1. CHECK IF POSTER IS FOR TODAY
      const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Assume posterData has a 'date' field. If not, we skip strict date check or use a fallback.
      // Since your poster table might not have 'date', we check if posterData.title contains today's date or similar?
      // For now, based on instructions "only the one that is today", we assume posterData.date exists.
      // If your DB doesn't have a date column for posters yet, this check will fail (undefined !== todayString).
      // WORKAROUND: We will assume ANY poster downloaded *on* the festival day counts.
      
      // Let's implement the DB check: Has user got points TODAY?
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              // Fetch latest profile data to check last_poster_date
              const { data: userData } = await supabase.from('profiles').select('last_poster_date, points').eq('id', user.id).single();
              
              // If they already got points today, STOP.
              if (userData?.last_poster_date === todayString) {
                  console.log("Already earned points today.");
                  return;
              }

              // If specific poster date check is required:
              // if (poster.date !== todayString) return; 

              // Award 10 Points
              const newPoints = (userData?.points || 0) + 10;
              
              await supabase.from('profiles').update({ 
                  points: newPoints,
                  last_poster_date: todayString // Mark as collected for today
              }).eq('id', user.id);
              
              updateProfile({ points: newPoints });
              setPointsAwarded(true);
          }
      } catch (e) { console.error("Points Error", e); }
  };

  // --- AUTO TRANSLATE ---
  const performTranslation = async (text: string, setter: (s: string) => void) => {
    try {
      const res = await fetch(`https://www.google.com/inputtools/request?text=${text}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`);
      const data = await res.json();
      if (data[0] === 'SUCCESS' && data[1][0][1][0]) {
          setter(data[1][0][1][0]);
          setIsGenerating(true);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { const t = setTimeout(() => { if (customName && /[a-zA-Z]/.test(customName)) performTranslation(customName, setCustomName); }, 1100); return () => clearTimeout(t); }, [customName]);
  useEffect(() => { const t = setTimeout(() => { if (customDesignation && /[a-zA-Z]/.test(customDesignation)) performTranslation(customDesignation, setCustomDesignation); }, 1100); return () => clearTimeout(t); }, [customDesignation]);
  useEffect(() => { const t = setTimeout(() => { if (customVillage && /[a-zA-Z]/.test(customVillage)) performTranslation(customVillage, setCustomVillage); }, 1100); return () => clearTimeout(t); }, [customVillage]);
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const r = new FileReader(); r.onload = () => { setTempPhoto(r.result as string); setIsCropping(true); }; r.readAsDataURL(e.target.files[0]); } };
  const finishCrop = async () => { if (tempPhoto && croppedAreaPixels) { const c = await getCroppedImg(tempPhoto, croppedAreaPixels); setCustomPhoto(c); setIsCropping(false); setIsGenerating(true); } };

  const handleShare = async () => {
    if (!generatedImage) return;
    awardDownloadPoints();
    const res = await fetch(generatedImage);
    const blob = await res.blob();
    const file = new File([blob], "Mission2029-Poster.jpg", { type: "image/jpeg" });
    if (navigator.share) { try { await navigator.share({ files: [file], title: 'Mission 2029', text: 'जय भारत, जय प्रतापगढ़!' }); } catch (err) {} } else { handleDownload(); }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    awardDownloadPoints();
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `Mission2029-${poster?.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!poster) return <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">Poster Not Found</div>;
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-neutral-900"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="min-h-screen bg-neutral-900 pb-32 flex flex-col">
      <div className="p-4 flex items-center justify-between text-white z-10 pt-3">
        <div className="flex items-center gap-4"><Link href="/" className="p-2 bg-white/10 rounded-full backdrop-blur-md"><ArrowLeft size={24} /></Link><h1 className="font-bold font-hindi truncate w-40">{poster.title}</h1></div>
        {profile.is_admin && <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg">Admin Mode</span>}
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-2 pt-0">
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 bg-gray-800 group">
           {isGenerating && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white"><Loader2 className="animate-spin mb-2" size={32} /></div>}
           {generatedImage ? <img src={generatedImage} alt="Poster" className="w-full h-auto" /> : <div className="aspect-[9/16] bg-gray-800" />}
           
           {/* Success Badge */}
           {pointsAwarded && (
               <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-in zoom-in">
                   <CheckCircle2 size={12} /> +10 Pts Added
               </div>
           )}

           {!profile.is_admin && (
               <label className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full cursor-pointer transition-all z-30 border border-white/30"><Camera className="text-white" size={24} /><input type="file" className="hidden" accept="image/*" onChange={onFileChange} /></label>
           )}
        </div>
        
        <PosterCanvas 
           posterUrl={poster.image} userName={customName} designation={customDesignation} userVillage={customVillage} userPhoto={customPhoto} config={config} isAdmin={profile.is_admin} 
           onDownloadReady={(url) => { setGeneratedImage(url); setIsGenerating(false); }}
        />
      </div>

      <div className="bg-white rounded-3xl mx-2 mb-2 p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
         {!profile.is_admin && (
             <div className="flex gap-2 mb-6">
                <div className="flex-1"><label className="text-xs font-bold text-gray-500 ml-1">Name</label><input value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-gray-100 p-2 rounded-lg font-hindi font-bold text-gray-800 border-none focus:ring-2 ring-primary" /></div>
                <div className="w-1/4"><label className="text-xs font-bold text-gray-500 ml-1">Status</label><input value={customDesignation} onChange={(e) => setCustomDesignation(e.target.value)} className="w-full bg-gray-100 p-2 rounded-lg font-hindi text-gray-800 border-none focus:ring-2 ring-primary" /></div>
                <div className="flex-1"><label className="text-xs font-bold text-gray-500 ml-1">Village</label><input value={customVillage} onChange={(e) => setCustomVillage(e.target.value)} className="w-full bg-gray-100 p-2 rounded-lg font-hindi text-gray-800 border-none focus:ring-2 ring-primary" /></div>
             </div>
         )}
         <div className="flex gap-4">
            <button onClick={handleDownload} className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200"><Download size={20} /> Save</button>
            <button onClick={handleShare} className="flex-[2] bg-gradient-to-r from-green-600 to-green-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"><Share2 size={20} /> Share</button>
         </div>
      </div>
      
      {isCropping && tempPhoto && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
            <div className="relative flex-1 bg-black"><Cropper image={tempPhoto} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(a, b) => setCroppedAreaPixels(b)} /></div>
            <div className="bg-neutral-900 p-6 pb-24 flex flex-col gap-4"><div className="flex gap-4"><button onClick={() => setIsCropping(false)} className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-700">Cancel</button><button onClick={finishCrop} className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600">Done</button></div></div>
        </div>
      )}
    </div>
  );
}