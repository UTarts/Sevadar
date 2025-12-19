'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/components/ProfileContext';
import PosterCanvas from '@/components/PosterCanvas';
import { Download, Share2, ArrowLeft, Loader2, Settings2, Camera } from 'lucide-react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

// Receive posterData directly from the Server Page
export default function CreatePosterClient({ posterData }: { posterData: any }) {
  const router = useRouter();
  const { profile, isLoaded } = useProfile();
  
  // Initialize state with the passed data (No fetching needed!)
  const [poster, setPoster] = useState<any>(posterData);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const [customName, setCustomName] = useState('');
  const [customDesignation, setCustomDesignation] = useState('');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  // Cropper
  const [isCropping, setIsCropping] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Debug
  const [showDebug, setShowDebug] = useState(false);
  const [config, setConfig] = useState({
    photoX: 545,
    photoY: 1391,
    photoSize: 480,
    nameX: 495,
    nameY: 1555,
    nameSize: 78,
    desigYOffset: 65
  });

  // Load Profile
  useEffect(() => {
    if (isLoaded && profile.name) {
      setCustomName(profile.name);
      setCustomDesignation(profile.designation);
      setCustomPhoto(profile.photo);
    } else if (isLoaded && !profile.name) {
      router.push('/profile');
    }
  }, [isLoaded, profile, router]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customName && /[a-zA-Z]/.test(customName)) performTranslation(customName, setCustomName);
    }, 800);
    return () => clearTimeout(timer);
  }, [customName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customDesignation && /[a-zA-Z]/.test(customDesignation)) performTranslation(customDesignation, setCustomDesignation);
    }, 800);
    return () => clearTimeout(timer);
  }, [customDesignation]);
  
  // Image Handlers
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempPhoto(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const finishCrop = async () => {
    if (tempPhoto && croppedAreaPixels) {
        const cropped = await getCroppedImg(tempPhoto, croppedAreaPixels);
        setCustomPhoto(cropped);
        setIsCropping(false);
        setIsGenerating(true);
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;
    const res = await fetch(generatedImage);
    const blob = await res.blob();
    const file = new File([blob], "Mission2029-Poster.jpg", { type: "image/jpeg" });

    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: 'Mission 2029',
          text: 'मेरा समर्थन कार्ड देखिए! जय भारत, जय प्रतापगढ़!'
        });
      } catch (err) { console.log("Share cancelled"); }
    } else {
      alert("Sharing not supported on this browser. Image downloaded.");
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `Mission2029-${poster?.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If poster is null, it means data failed to pass. But if !isLoaded, we wait for profile.
  if (!poster) return <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">Poster Not Found</div>;
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-neutral-900"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="min-h-screen bg-neutral-900 pb-32 flex flex-col">
      <div className="p-4 flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-white/10 rounded-full backdrop-blur-md">
            <ArrowLeft size={24} />
            </Link>
            <h1 className="font-bold font-hindi truncate w-40">{poster.title}</h1>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 bg-gray-800 group">
           {isGenerating && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                <Loader2 className="animate-spin mb-2" size={32} />
             </div>
           )}
           {generatedImage ? <img src={generatedImage} alt="Poster" className="w-full h-auto" /> : <div className="aspect-[9/16] bg-gray-800" />}
           <label className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full cursor-pointer transition-all z-30 border border-white/30">
                <Camera className="text-white" size={24} />
                <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
           </label>
        </div>
        <PosterCanvas 
           posterUrl={poster.image} userName={customName} designation={customDesignation} userPhoto={customPhoto} config={config}
           onDownloadReady={(url) => { setGeneratedImage(url); setIsGenerating(false); }}
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-3xl mx-2 mb-2 p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
         <div className="flex gap-3 mb-6">
            <div className="flex-1">
               <label className="text-xs font-bold text-gray-500 ml-1">Name</label>
               <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-gray-100 p-2 rounded-lg font-hindi font-bold text-gray-800 border-none focus:ring-2 ring-primary" />
            </div>
            <div className="flex-1">
               <label className="text-xs font-bold text-gray-500 ml-1">Status</label>
               <input value={customDesignation} onChange={(e) => setCustomDesignation(e.target.value)} className="w-full bg-gray-100 p-2 rounded-lg font-hindi text-gray-800 border-none focus:ring-2 ring-primary" />
            </div>
         </div>

         <div className="flex gap-4">
            <button onClick={handleDownload} className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200">
               <Download size={20} /> Save
            </button>
            <button onClick={handleShare} className="flex-[2] bg-gradient-to-r from-green-600 to-green-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
               <Share2 size={20} /> Share
            </button>
         </div>
      </div>
      
      {/* Cropper */}
      {isCropping && tempPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
            <div className="relative flex-1 bg-black">
                <Cropper image={tempPhoto} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(a, b) => setCroppedAreaPixels(b)} />
            </div>
            <div className="bg-neutral-900 p-6 flex flex-col gap-4 pb-safe">
                <div className="flex gap-4">
                    <button onClick={() => setIsCropping(false)} className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-700">Cancel</button>
                    <button onClick={finishCrop} className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600">Done</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}