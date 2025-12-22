'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Phone, HelpCircle, ArrowRight, Languages, Check, Eye, EyeOff } from 'lucide-react';
import { useProfile } from './ProfileContext';
import { useRouter } from 'next/navigation';

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { updateProfile, t, language, setLanguage } = useProfile();
  
  const [view, setView] = useState<'language' | 'auth'>('language'); 
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ phone: '', password: '', secretQ: 'Mothers Village Name?', secretA: '', newPass: '' });

  useEffect(() => { if(isOpen) setView('language'); }, [isOpen]);

  if (!isOpen) return null;

  const getEmail = (ph: string) => `${ph}@sevadar.com`;

  const handleAuth = async () => {
    setLoading(true); setError('');
    const { phone, password, secretA, newPass } = form;

    try {
      if (mode === 'signup') {
         if (!phone || !password || !secretA) throw new Error(language === 'en' ? "Please fill all fields" : "कृपया सभी जानकारी भरें");
         const { data, error: upErr } = await supabase.auth.signUp({ email: getEmail(phone), password });
         if (upErr) throw upErr;
         if (data.user) {
             await supabase.from('profiles').update({ secret_question: form.secretQ, secret_answer: secretA.toLowerCase().trim(), phone: phone }).eq('id', data.user.id);
             // New users are never admins by default
             updateProfile({ name: '', photo: null, setup_complete: false, is_admin: false }); 
             onClose();
         }
      } 
      else if (mode === 'login') {
         const { data, error: inErr } = await supabase.auth.signInWithPassword({ email: getEmail(phone), password });
         if (inErr) throw inErr;
         
         if (data.user) {
             const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
             if (p) {
                 updateProfile({ 
                     name: p.full_name, 
                     designation: p.designation, 
                     village: p.village, 
                     photo: p.avatar_url, 
                     setup_complete: p.setup_complete,
                     is_admin: p.is_admin === true // Check DB flag
                 });
                 onClose();
                 
                 // --- VITAL REDIRECT LOGIC ---
                 if (p.is_admin) {
                     router.push('/admin'); // Admin goes to Dashboard
                 } else {
                     router.push('/'); // Normal user goes Home
                 }
             }
         }
      }
      else if (mode === 'reset') {
         const { data: p } = await supabase.from('profiles').select('*').eq('phone', phone).single();
         if (!p) throw new Error("User not found");
         if (p.secret_answer !== secretA.toLowerCase().trim()) throw new Error("Wrong Answer");
         await supabase.auth.updateUser({ password: newPass });
         alert("Password Changed! Please Login.");
         setMode('login');
      }
    } catch (err: any) {
      setError(err.message.includes('registered') ? (language === 'en' ? 'Number already exists' : 'यह नंबर पहले से पंजीकृत है') : err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* VIEW 1: LANGUAGE */}
        {view === 'language' && (
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2"><Languages size={32} /></div>
                <div><h2 className="text-2xl font-bold text-gray-800">भाषा चुनें</h2><p className="text-gray-500 text-sm">Choose your language to proceed</p></div>
                <div className="space-y-3">
                    <button onClick={() => setLanguage('hi')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${language === 'hi' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:bg-gray-50'}`}><span className="font-bold text-lg">हिंदी</span>{language === 'hi' && <Check size={20} className="text-orange-600" />}</button>
                    <button onClick={() => setLanguage('en')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${language === 'en' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:bg-gray-50'}`}><span className="font-bold text-lg">English</span>{language === 'en' && <Check size={20} className="text-orange-600" />}</button>
                </div>
                <button onClick={() => setView('auth')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">{language === 'hi' ? 'आगे बढ़ें' : 'Continue'} <ArrowRight size={20} /></button>
            </div>
        )}

        {/* VIEW 2: AUTH */}
        {view === 'auth' && (
            <>
                <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-full"><X size={18}/></button>
                    <button onClick={() => setView('language')} className="absolute top-4 left-4 p-1.5 bg-white/20 rounded-full flex items-center gap-1 px-3 text-xs font-bold"><Languages size={12} /> {language === 'en' ? 'EN' : 'हिंदी'}</button>
                    <h2 className="text-3xl font-bold font-hindi mt-4">{mode === 'login' ? t.login : mode === 'signup' ? t.welcome : t.change_password}</h2>
                    <p className="text-orange-100 text-sm font-medium mt-1">Mission 2029 - Sevadar</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-400 ml-2">MOBILE NUMBER</label><div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"><span className="text-gray-400 font-bold mr-2">+91</span><input type="tel" maxLength={10} className="bg-transparent w-full font-bold text-lg outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})} /><Phone size={20} className="text-gray-300" /></div></div>
                    {mode !== 'login' && (<div className="space-y-1"><label className="text-xs font-bold text-gray-400 ml-2">{t.security_question}</label><div className="p-3 bg-orange-50 rounded-xl text-xs font-bold text-orange-700 border border-orange-100 mb-2">{language === 'en' ? "Mother's Village?" : "ननिहाल किस गाँव में है?"}</div><div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"><input className="bg-transparent w-full font-bold outline-none" placeholder="Answer..." value={form.secretA} onChange={e => setForm({...form, secretA: e.target.value})} /><HelpCircle size={20} className="text-gray-300" /></div></div>)}
                    <div className="space-y-1"><div className="flex justify-between px-2"><label className="text-xs font-bold text-gray-400">PASSWORD</label>{mode === 'login' && <button onClick={() => setMode('reset')} className="text-xs font-bold text-orange-600">Forgot?</button>}</div><div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"><input type={showPass ? "text" : "password"} className="bg-transparent w-full font-bold text-lg outline-none" value={mode === 'reset' ? form.newPass : form.password} onChange={e => setForm(mode === 'reset' ? {...form, newPass: e.target.value} : {...form, password: e.target.value})} /><button onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={20} className="text-gray-400"/> : <Eye size={20} className="text-gray-400"/>}</button></div></div>
                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-xl">{error}</div>}
                    <button onClick={handleAuth} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? t.login : mode === 'signup' ? t.create_now : t.save)}</button>
                    <div className="text-center"><p className="text-xs font-bold text-gray-400">{mode === 'login' ? <button onClick={() => setMode('signup')} className="text-orange-600 hover:underline">{t.create_now}</button> : <button onClick={() => setMode('login')} className="text-orange-600 hover:underline">{t.login}</button>}</p></div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}