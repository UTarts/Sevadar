'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProfile } from '@/components/ProfileContext';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { Camera, Save, ArrowLeft, Edit2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { profile, updateProfile } = useProfile();
  const router = useRouter();

  // Form State
  const [name, setName] = useState(profile.name);
  const [designation, setDesignation] = useState(profile.designation);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Cropper State
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(profile.photo);

  // --- AUTOMATIC TRANSLATION (DEBOUNCE) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (name && /[a-zA-Z]/.test(name)) {
        performTranslation(name, setName);
      }
    }, 1200); // Wait 800ms after typing stops
    return () => clearTimeout(timer);
  }, [name]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (designation && /[a-zA-Z]/.test(designation)) {
        performTranslation(designation, setDesignation);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [designation]);

  const performTranslation = async (text: string, setter: (s: string) => void) => {
    setIsTranslating(true);
    try {
      const res = await fetch(`https://www.google.com/inputtools/request?text=${text}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`);
      const data = await res.json();
      if (data[0] === 'SUCCESS' && data[1][0][1][0]) {
          setter(data[1][0][1][0]);
      }
    } catch (e) { console.error(e); }
    setIsTranslating(false);
  };
  // ----------------------------------------

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setTempPhoto(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      if (tempPhoto && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(tempPhoto, croppedAreaPixels);
        setPreviewPhoto(croppedImage);
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    updateProfile({
      name,
      designation,
      photo: previewPhoto
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans pb-32 pt-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 fixed top-0 left-0 right-0 z-40 flex items-center gap-4 shadow-md">
        <Link href="/" replace={true} >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold font-hindi">मेरी प्रोफाइल (Edit Profile)</h1>
        {isTranslating && <Loader2 size={18} className="animate-spin ml-auto" />}
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-8">
        
        {/* Photo Upload */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gray-200">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                   <UserIconSize />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-secondary text-white p-3 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
              <Camera size={24} />
              <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
            </label>
          </div>
          <p className="mt-4 text-sm text-gray-500">फोटो बदलने के लिए कैमरा आइकॉन दबाएं</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">आपका नाम (Auto Hindi)</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none text-lg font-hindi font-bold"
                placeholder="उदा. Utkarsh Tripathi"
              />
              <div className="absolute right-4 top-4 text-gray-400"><Edit2 size={20} /></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">पद / गांव (Auto Hindi)</label>
            <div className="relative">
                <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none text-lg font-hindi"
                placeholder="उदा. Gram Pradhan, Udaipur"
                />
                <div className="absolute right-4 top-4 text-gray-400"><Edit2 size={20} /></div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!name}
          className="w-full bg-gradient-to-r from-primary to-primary-dark text-white p-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          प्रोफाइल सेव करें (Save)
        </button>

      </div>

      {/* Cropper Modal */}
      {isCropping && tempPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col ">
          <div className="relative flex-1 bg-black">
            <Cropper
              image={tempPhoto}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="bg-neutral-900 p-6 flex flex-col gap-4 pb-safe">
            <div className="flex items-center gap-4">
              <span className="text-white text-xs">Zoom</span>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-primary h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex gap-4">
               <button onClick={() => setIsCropping(false)} className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-700">Cancel</button>
               <button onClick={showCroppedImage} className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIconSize() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
}