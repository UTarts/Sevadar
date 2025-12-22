'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/components/ProfileContext';
import { LogOut, User, MapPin, Award, Shield, Camera, Edit2, Check, X, Loader2, Lock, ChevronRight } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function ProfilePage() {
    const router = useRouter();
    const { updateProfile, t, language, setLanguage, profile } = useProfile(); // Get 'profile'
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', village: '', designation: '' });
  const [changePassMode, setChangePassMode] = useState(false);
  const [passForm, setPassForm] = useState({ old: '', new: '' });

  // Photo States
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => { 
    // 1. ADMIN CHECK: Redirect to dashboard if Admin
    if (profile?.is_admin) {
        router.replace('/admin');
        return;
    }
    
    fetchProfile(); 
  }, [profile]); 

  useEffect(() => { fetchProfile(); }, []);

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

  // --- PASSWORD CHANGE ---
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

  // --- UPLOAD LOGIC (CLOUDINARY) ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => { setTempPhoto(reader.result as string); setIsCropping(true); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- SMART COMPRESSED UPLOAD ---
  const handleCropSave = async () => {
    if (!tempPhoto || !croppedAreaPixels) return;
    setSaving(true); // Show loader

    try {
        // 1. Get Cropped Blob
        const croppedImgUrl = await getCroppedImg(tempPhoto, croppedAreaPixels);
        const res = await fetch(croppedImgUrl);
        const blob = await res.blob();

        // 2. Client-Side Compression (Max 500px)
        const compressedBlob = await new Promise<Blob>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 500; // Limit width/height
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                } else {
                    if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Output JPEG at 80% quality
                canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
            };
            img.src = URL.createObjectURL(blob);
        });

        // 3. Upload to Cloudinary
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
        
        if (!cloudName || !uploadPreset) throw new Error("Missing Config");

        const data = new FormData();
        data.append('file', compressedBlob);
        data.append('upload_preset', uploadPreset);
        data.append('folder', 'sevadar_profiles');

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST', body: data
        });
        const json = await cloudRes.json();

        if (json.secure_url) {
            // 4. Update Database
            await supabase.from('profiles').update({ avatar_url: json.secure_url }).eq('id', user.id);
            
            // 5. Update UI
            setDbProfile({ ...dbProfile, avatar_url: json.secure_url });
            updateProfile({ name: dbProfile.full_name, photo: json.secure_url });
            setIsCropping(false);
        } else {
            alert("Upload failed");
        }
        } catch (err) {
            console.error(err);
            alert("Error uploading image");
        }
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-neutral-100 pt-safe pb-24 font-sans">
      
      <div className="bg-white p-6 pb-16 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative group mb-3">
                <div className="w-28 h-28 bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    {dbProfile?.avatar_url ? <img src={dbProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-gray-400 m-auto mt-8" />}
                </div>
                <label className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md active:scale-95 transition-transform">
                    <Camera size={16} /><input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                </label>
            </div>

            {isEditing ? (
                <div className="w-full max-w-xs space-y-3 animate-in fade-in">
                    <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full text-center text-xl font-bold border-b-2 border-primary outline-none bg-transparent" placeholder="Full Name" />
                    <input value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} className="w-full text-center text-sm font-medium text-gray-500 border-b border-gray-300 outline-none bg-transparent" placeholder="Status (Optional)" />
                </div>
            ) : (
                <div className="text-center">
                    <h1 className="text-2xl font-bold font-hindi text-gray-800">{dbProfile?.full_name || 'User'}</h1>
                    <p className="text-sm text-gray-500 font-bold tracking-wide mt-1">{dbProfile?.designation || 'Active Member'}</p>
                </div>
            )}
        </div>

        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1">
            {isEditing ? (
               <div className="flex gap-2">
                   <button onClick={() => setIsEditing(false)} className="p-2 bg-red-100 text-red-600 rounded-full"><X size={18}/></button>
                   <button onClick={saveDetails} disabled={saving} className="p-2 bg-green-100 text-green-600 rounded-full">
                       {saving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                   </button>
               </div>
            ) : (
               <button onClick={() => setIsEditing(true)} className="flex flex-col items-center group">
                   <div className="p-2 bg-gray-100 text-gray-600 rounded-full group-hover:bg-primary group-hover:text-white transition-colors"><Edit2 size={18} /></div>
                   <span className="text-[10px] font-bold text-gray-400 mt-1">Edit Profile</span>
               </button>
            )}
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-xs font-bold text-gray-400">Current Rank</span>
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-1">
                        <Award className="text-primary" size={18} /> {milestone.name}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-gray-400">Next: {milestone.next}</span>
                    <p className="text-sm font-bold text-primary">{dbProfile?.points || 0} / {milestone.target}</p>
                </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${milestone.color} transition-all duration-1000`} style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <MapPin className="text-blue-600" size={20} />
              <div className="flex-1">
                  {isEditing ? (
                      <input value={editForm.village} onChange={e => setEditForm({...editForm, village: e.target.value})} className="w-full font-bold border-b border-gray-200 outline-none" placeholder="Enter Village" />
                  ) : (
                      <>
                        <h3 className="font-bold text-gray-800 text-sm">{t.village}</h3>
                        <p className="text-xs text-gray-500 font-hindi">{dbProfile?.village || 'Not Set'}</p>
                      </>
                  )}
              </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {language === 'en' ? 'A' : 'अ'}
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">Language / भाषा</h3>
              </div>
              <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="text-xs font-bold bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                {language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
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

          <button onClick={handleLogout} className="w-full bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 text-red-600 mt-4 active:scale-95 transition-transform">
              <LogOut size={20} /> <span className="font-bold text-sm">{t.logout}</span>
          </button>
      </div>
      
      {isCropping && tempPhoto && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col"><div className="relative flex-1"><Cropper image={tempPhoto} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} /></div><div className="bg-neutral-900 p-6 flex gap-4"><button onClick={() => setIsCropping(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold">Cancel</button><button onClick={handleCropSave} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">
            {saving ? <Loader2 className="animate-spin" /> : 'Save'}
        </button></div></div>
      )}
    </div>
  );
}