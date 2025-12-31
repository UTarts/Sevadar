'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from './ProfileContext';
import { ChevronRight, Check, MapPin, User, Camera, Loader2, LogOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function OnboardingWizard() {
  const { profile, updateProfile, t } = useProfile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', village: '', designation: '', photo: null as string | null });

  // Cropper State
  const [isCropping, setIsCropping] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // 1. AUTO-SKIP FOR ADMINS (Admin doesn't need wizard)
  useEffect(() => {
      if (profile.is_admin && !profile.setup_complete) {
          // Silently mark complete
          const skipAdmin = async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if(user) {
                  await supabase.from('profiles').update({ setup_complete: true }).eq('id', user.id);
                  updateProfile({ setup_complete: true });
              }
          };
          skipAdmin();
      }
  }, [profile.is_admin, profile.setup_complete]);

  if (!profile || profile.setup_complete || profile.is_admin) return null;

  // --- ESCAPE HATCH: LOGOUT ---
  const handleEmergencyLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => { setTempPhoto(reader.result as string); setIsCropping(true); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async () => {
    if (!tempPhoto || !croppedAreaPixels) return;
    setLoading(true);
    try {
        const croppedImgUrl = await getCroppedImg(tempPhoto, croppedAreaPixels);
        const res = await fetch(croppedImgUrl);
        const blob = await res.blob();

        // Compress
        const compressedBlob = await new Promise<Blob>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 500;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
                else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
            };
            img.src = URL.createObjectURL(blob);
        });

        // Upload
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
        if (!cloudName || !uploadPreset) throw new Error("Missing Config");

        const data = new FormData();
        data.append('file', compressedBlob);
        data.append('upload_preset', uploadPreset);
        data.append('folder', 'sevadar_profiles');

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
        const json = await cloudRes.json();

        if (json.secure_url) {
            setFormData({ ...formData, photo: json.secure_url });
            setIsCropping(false);
        } else {
            alert("Upload failed: " + json.error?.message);
        }
    } catch (e) {
        console.error(e);
        alert("Error uploading image");
    }
    setLoading(false);
  };

  const handleNext = () => {
      if (step === 1 && formData.name) { setStep(2); return; }
      if (step === 2 && formData.village) { setStep(3); return; }
      if (step === 3) { setStep(4); return; }
  };

  const handleFinish = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').update({
          full_name: formData.name,
          village: formData.village,
          designation: formData.designation || 'नागरिक',
          avatar_url: formData.photo,
          setup_complete: true,
          points: 10
      }).eq('id', user.id);

      if (error) {
          alert("Save Failed: " + error.message); // Show actual DB error
      } else {
          updateProfile({ 
              name: formData.name, 
              village: formData.village, 
              designation: formData.designation || 'नागरिक',
              photo: formData.photo,
              setup_complete: true 
          });
      }
      setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 font-sans">
       
       <div className="h-1 bg-gray-100 w-full">
           <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(step/4)*100}%` }} />
       </div>

       {/* LOGOUT BUTTON (Escape Hatch) */}
       <button onClick={handleEmergencyLogout} className="absolute top-4 right-4 text-xs font-bold text-gray-400 flex items-center gap-1 z-50">
           <LogOut size={14}/> Logout
       </button>

       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
           
           {/* STEP 1: NAME */}
           {step === 1 && (
               <div className="animate-in fade-in zoom-in duration-300 w-full flex flex-col items-center">
                  <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-100"><User size={40} /></div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.whats_your_name}</h1>
                  <input autoFocus placeholder={t.enter_name} className="w-full max-w-xs text-center text-2xl font-bold border-b-2 border-orange-200 focus:border-orange-500 outline-none pb-2 bg-transparent mt-4"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
           )}

           {/* STEP 2: VILLAGE */}
           {step === 2 && (
               <div className="animate-in fade-in zoom-in duration-300 w-full flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100"><MapPin size={40} /></div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.where_are_you_from}</h1>
                  <div className="w-full max-w-xs space-y-6 mt-4">
                    <input placeholder={t.enter_village} className="w-full text-center text-xl font-bold border-b-2 border-green-200 focus:border-green-500 outline-none pb-2 bg-transparent"
                        value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} />
                    <input placeholder={t.enter_status} className="w-full text-center text-lg text-gray-600 border-b border-gray-200 focus:border-green-500 outline-none pb-2 bg-transparent"
                        value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                  </div>
               </div>
           )}

           {/* STEP 3: PHOTO UPLOAD */}
           {step === 3 && (
               <div className="animate-in fade-in zoom-in duration-300 w-full flex flex-col items-center">
                  <div className="relative">
                      <div className="w-32 h-32 bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                          {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={64} /></div>}
                      </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">{t.upload_photo}</h1>
                  <p className="text-gray-500 text-sm mb-6">{t.upload_photo_desc}</p>
                  
                  <label className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2 cursor-pointer">
                      <Camera size={20} />
                      {t.tap_to_upload}
                      <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                  </label>
                  
                  <button onClick={() => setStep(4)} className="mt-6 text-gray-400 text-sm font-bold hover:text-gray-600">{t.skip_for_now}</button>
               </div>
           )}

           {/* STEP 4: WELCOME */}
           {step === 4 && (
               <div className="animate-in fade-in zoom-in duration-300 w-full flex flex-col items-center">
                  <div className="w-24 h-24 bg-yellow-400 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-yellow-200 animate-bounce"><Check size={48} strokeWidth={4} /></div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.you_are_ready}</h1>
                  <p className="text-gray-500 mb-8">{t.setup_complete}</p>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl w-full max-w-xs mb-6">
                      <div className="text-xs font-bold text-orange-400 uppercase">{t.bonus_points}</div>
                      <div className="text-2xl font-bold text-orange-600">+10 Points Added</div>
                  </div>
               </div>
           )}

           {/* CROPPER MODAL */}
           {isCropping && tempPhoto && (
             <div className="absolute inset-0 z-[300] bg-black flex flex-col animate-in fade-in">
                <div className="relative flex-1">
                    <Cropper image={tempPhoto} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} />
                </div>
                <div className="bg-neutral-900 p-6 flex gap-4">
                    <button onClick={() => setIsCropping(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold">Cancel</button>
                    <button onClick={handleCropSave} disabled={loading} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold flex justify-center gap-2">
                         {loading ? <Loader2 className="animate-spin" /> : 'Crop & Save'}
                    </button>
                </div>
             </div>
           )}
       </div>

       <div className="p-6">
           <button 
             onClick={step === 4 ? handleFinish : handleNext}
             disabled={loading || (step === 1 && !formData.name) || (step === 2 && !formData.village)}
             className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
           >
               {loading ? 'Processing...' : step === 4 ? t.start_sevadar : t.next} 
               {!loading && <ChevronRight />}
           </button>
       </div>
    </div>
  );
}