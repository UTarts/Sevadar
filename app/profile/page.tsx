'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/components/ProfileContext';
import { LogOut, User, MapPin, Award, Shield, Camera, Edit2, Check, X, Loader2, Lock, ChevronRight, HelpCircle, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

// --- PROFILE SKELETON ---
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-neutral-100 pt-safe pb-24 font-sans animate-pulse">
    <div className="bg-white p-6 pb-16 rounded-b-[2.5rem] shadow-sm flex flex-col items-center">
        <div className="w-28 h-28 bg-gray-200 rounded-full border-4 border-white shadow-lg mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="px-4 -mt-10 relative z-20 mb-6 space-y-4">
        <div className="bg-white h-24 rounded-2xl"></div>
        <div className="bg-white h-16 rounded-2xl"></div>
    </div>
  </div>
);

export default function ProfilePage() {
    const router = useRouter();
    const { updateProfile, t, language, setLanguage, profile } = useProfile(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', village: '', designation: '' });
  const [changePassMode, setChangePassMode] = useState(false);
  const [passForm, setPassForm] = useState({ old: '', new: '' });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Photo States
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => { 
    if (profile?.is_admin) { router.replace('/admin'); return; }
    fetchProfile(); 
  }, [profile]); 

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUser(user);

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setDbProfile(data);
      setEditForm({ full_name: data.full_name || '', village: data.village || '', designation: data.designation || '' });
      updateProfile({ name: data.full_name, designation: data.designation, photo: data.avatar_url });
    }
    setLoading(false);
  };

  const getMilestoneData = (points: number) => {
      if (points < 100) return { name: 'Bronze', next: 'Silver', target: 100, color: 'bg-orange-600' };
      if (points < 500) return { name: 'Silver', next: 'Gold', target: 500, color: 'bg-gray-400' };
      if (points < 2000) return { name: 'Gold', next: 'Diamond', target: 2000, color: 'bg-yellow-500' };
      return { name: 'Diamond', next: 'Max', target: 10000, color: 'bg-blue-500' };
  };
  const milestone = dbProfile ? getMilestoneData(dbProfile.points || 0) : { name: 'Bronze', next: 'Silver', target: 100, color: 'bg-orange-600' };
  const progressPercent = Math.min(100, ((dbProfile?.points || 0) / milestone.target) * 100);

  const handleChangePassword = async () => {
      if (!passForm.old || !passForm.new) return alert("Fill all fields");
      setSaving(true);
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: user.email, password: passForm.old });
      if (loginError) { alert("Old Password is Wrong"); setSaving(false); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: passForm.new });
      if (updateError) alert("Error changing password");
      else { alert("Password Changed Successfully!"); setChangePassMode(false); setPassForm({ old: '', new: '' }); }
      setSaving(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => { setTempPhoto(reader.result as string); setIsCropping(true); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async () => {
    if (!tempPhoto || !croppedAreaPixels) return;
    setSaving(true); 
    try {
        const croppedImgUrl = await getCroppedImg(tempPhoto, croppedAreaPixels);
        const res = await fetch(croppedImgUrl);
        const blob = await res.blob();
        const compressedBlob = await new Promise<Blob>((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 500; 
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
                else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
            };
            img.src = URL.createObjectURL(blob);
        });
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
            await supabase.from('profiles').update({ avatar_url: json.secure_url }).eq('id', user.id);
            setDbProfile({ ...dbProfile, avatar_url: json.secure_url });
            updateProfile({ name: dbProfile.full_name, photo: json.secure_url });
            setIsCropping(false);
        }
    } catch (err) { alert("Error uploading image"); }
    setSaving(false);
  };

  const saveDetails = async () => {
    setSaving(true);
    await supabase.from('profiles').update(editForm).eq('id', user.id);
    setDbProfile({ ...dbProfile, ...editForm });
    updateProfile({ name: editForm.full_name, designation: editForm.designation });
    setIsEditing(false);
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    updateProfile({ name: '', photo: null });
    router.push('/');
    window.location.reload();
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-neutral-100 pt-safe pb-24 font-sans">
      
      {/* 1. HEADER SECTION (Colored) */}
      <div className="bg-gradient-to-b from-orange-500 to-orange-600 p-6 pb-20 rounded-b-[3rem] shadow-lg relative overflow-hidden text-white">
        <div className="relative z-10 flex flex-col items-center">
            {/* Edit Button */}
            <div className="absolute top-0 right-0 z-20">
                {isEditing ? (
                   <div className="flex gap-2">
                       <button onClick={() => setIsEditing(false)} className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md"><X size={18}/></button>
                       <button onClick={saveDetails} disabled={saving} className="p-2 bg-green-500 text-white rounded-full shadow-lg">
                           {saving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                       </button>
                   </div>
                ) : (
                   <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md hover:bg-white/30 transition">
                       <Edit2 size={18} />
                   </button>
                )}
            </div>

            {/* Profile Photo */}
            <div className="relative group mb-3">
                <div className="w-28 h-28 bg-white rounded-full border-4 border-white/50 shadow-2xl overflow-hidden relative">
                    {dbProfile?.avatar_url ? (
                        <Image src={dbProfile.avatar_url} alt="Profile" fill className="object-cover"/>
                    ) : (
                        <User size={48} className="text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                </div>
                <label className="absolute bottom-1 right-1 bg-gray-900 text-white p-2 rounded-full cursor-pointer shadow-md active:scale-95 transition-transform z-10">
                    <Camera size={14} /><input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                </label>
            </div>

            {/* Name */}
            {isEditing ? (
                <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full text-center text-xl font-bold border-b-2 border-white/50 outline-none bg-transparent placeholder-white/70 text-white" placeholder="Full Name" />
            ) : (
                <h1 className="text-2xl font-bold font-hindi">{dbProfile?.full_name || 'User'}</h1>
            )}
        </div>
      </div>

      {/* 2. STATS GRID (Side by Side) */}
      <div className="px-4 -mt-12 relative z-20 mb-4 grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center h-28">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t.designation}</span>
              {isEditing ? (
                  <input value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} className="w-full text-center font-bold border-b border-gray-200 outline-none text-sm" placeholder="Post" />
              ) : (
                  <p className="font-bold text-gray-800 text-sm font-hindi leading-snug line-clamp-2">{dbProfile?.designation || 'Member'}</p>
              )}
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center h-28">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t.village}</span>
              {isEditing ? (
                  <input value={editForm.village} onChange={e => setEditForm({...editForm, village: e.target.value})} className="w-full text-center font-bold border-b border-gray-200 outline-none text-sm" placeholder="Village" />
              ) : (
                  <p className="font-bold text-gray-800 text-sm font-hindi leading-snug line-clamp-2">{dbProfile?.village || 'Not Set'}</p>
              )}
          </div>
      </div>

      {/* 3. RANK BAR */}
      <div className="px-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-2">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1">
                    <Award className="text-orange-500" size={18} /> {milestone.name}
                </h3>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400">{t.next_rank}: {milestone.next}</span>
                    <p className="text-xs font-bold text-gray-600">{dbProfile?.points || 0} / {milestone.target}</p>
                </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${milestone.color} transition-all duration-1000`} style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>
      </div>

      {/* 4. SETTINGS LIST */}
      <div className="px-4 space-y-3 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {language === 'en' ? 'A' : 'क'}
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">{t.switch_language}</h3>
              </div>
              <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="text-xs font-bold bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                {language === 'en' ? 'हिंदी' : 'English'}
              </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setChangePassMode(!changePassMode)} className="w-full p-4 flex items-center gap-4 text-left">
                  <Lock className="text-orange-500" size={20} />
                  <div className="flex-1 font-bold text-gray-800 text-sm">{t.change_password}</div>
                  <ChevronRight size={16} className={`transition-transform ${changePassMode ? 'rotate-90' : ''}`} />
              </button>
              {changePassMode && (
                  <div className="p-4 pt-0 bg-gray-50 space-y-3 animate-in slide-in-from-top-2">
                      <input type="password" placeholder="Old Password" value={passForm.old} onChange={e => setPassForm({...passForm, old: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm" />
                      <input type="password" placeholder="New Password" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm" />
                      <button onClick={handleChangePassword} disabled={saving} className="w-full bg-orange-500 text-white py-2 rounded-xl font-bold text-sm">
                          {saving ? 'Updating...' : 'Update Password'}
                      </button>
                  </div>
              )}
          </div>

          <button onClick={handleLogout} className="w-full bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 text-red-600 active:scale-95 transition-transform">
              <LogOut size={20} /> <span className="font-bold text-sm">{t.logout}</span>
          </button>
      </div>

      {/* 5. FAQ SECTION */}
      <div className="px-4 pb-8">
          <h3 className="text-lg font-bold text-gray-800 font-hindi mb-4 flex items-center gap-2">
              <HelpCircle className="text-gray-400" size={20} />
              {t.faq_title}
          </h3>
          <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button 
                        onClick={() => setExpandedFaq(expandedFaq === num ? null : num)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                          <span className="font-bold text-gray-700 text-sm font-hindi pr-2">{t[`faq_${num}_q`]}</span>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedFaq === num ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedFaq === num && (
                          <div className="p-4 pt-0 bg-gray-50 text-xs text-gray-600 leading-relaxed font-medium font-hindi border-t border-gray-100 animate-in slide-in-from-top-1">
                              {t[`faq_${num}_a`]}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
      
      {/* Cropper Modal */}
      {isCropping && tempPhoto && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col"><div className="relative flex-1"><Cropper image={tempPhoto} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} /></div><div className="bg-neutral-900 p-6 flex gap-4"><button onClick={() => setIsCropping(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold">Cancel</button><button onClick={handleCropSave} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">{saving ? <Loader2 className="animate-spin" /> : 'Save'}</button></div></div>
      )}
    </div>
  );
}