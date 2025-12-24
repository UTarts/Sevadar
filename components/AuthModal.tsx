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
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('signup');
  
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ phone: '', password: '', secretQ: "Mother's Village Name?", secretA: '', newPass: '' });

  useEffect(() => { if(isOpen) setView('language'); }, [isOpen]);

  if (!isOpen) return null;

  const getEmail = (ph: string) => `${ph}@sevadar.com`;

  const handleAuth = async () => {
    setLoading(true); setError('');
    const email = getEmail(form.phone);

    try {
      if (mode === 'signup') {
         if (!form.phone || !form.password || !form.secretA) throw new Error(language === 'en' ? "Please fill all fields" : "कृपया सभी जानकारी भरें");
         const { data, error: upErr } = await supabase.auth.signUp({ 
             email, 
             password: form.password,
             options: { data: { secret_answer: form.secretA.toLowerCase().trim() } }
         });
         if (upErr) throw upErr;
         
         const { error: signError } = await supabase.auth.signInWithPassword({ email, password: form.password });
         if (!signError) {
             const { data: { user } } = await supabase.auth.getUser();
             if(user) {
                 // Initialize Profile
                 await supabase.from('profiles').upsert({ id: user.id, full_name: 'User', points: 50 });
                 updateProfile({ setup_complete: false }); 
                 onClose();
             }
         }
      } 
      else if (mode === 'login') {
         const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
         if (error) throw error;
         onClose();
         window.location.reload();
      }
      else if (mode === 'reset') {
         if(!form.secretA || !form.newPass) throw new Error("Fill all fields");
         // NOTE: Client-side recovery without email requires backend RPC logic.
         // This implies you have logic to check the secret answer via Supabase Edge Function or RPC.
         // For now, standard behavior:
         setError("For recovery without email, please contact Admin.");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {view === 'language' && (
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2"><Languages size={32} /></div>
                <div><h2 className="text-2xl font-bold text-gray-800">भाषा चुनें</h2><p className="text-gray-500 text-sm">Choose your language to proceed</p></div>
                <div className="space-y-3">
                    <button onClick={() => { setLanguage('hi'); setView('auth'); }} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${language === 'hi' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:bg-gray-50'}`}><span className="font-bold text-lg">हिंदी</span>{language === 'hi' && <Check size={20} className="text-orange-600" />}</button>
                    <button onClick={() => { setLanguage('en'); setView('auth'); }} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${language === 'en' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:bg-gray-50'}`}><span className="font-bold text-lg">English</span>{language === 'en' && <Check size={20} className="text-orange-600" />}</button>
                </div>
                <button onClick={() => setView('auth')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">{language === 'hi' ? 'आगे बढ़ें' : 'Continue'} <ArrowRight size={20} /></button>
            </div>
        )}

        {view === 'auth' && (
            <>
                <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-full"><X size={18}/></button>
                    <button onClick={() => setView('language')} className="absolute top-4 left-4 p-1.5 bg-white/20 rounded-full flex items-center gap-1 px-3 text-xs font-bold"><Languages size={12} /> {language === 'en' ? 'EN' : 'हिंदी'}</button>
                    <h2 className="text-3xl font-bold font-hindi mt-4">{mode === 'login' ? t.login : mode === 'signup' ? t.welcome : t.change_password}</h2>
                    <p className="text-orange-100 text-sm font-medium mt-1">Mission 2029 - Sevadar</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 ml-2">{t.phone_number}</label>
                        <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                            <span className="text-gray-400 font-bold mr-2">+91</span>
                            <input autoFocus type="tel" maxLength={10} className="bg-transparent w-full font-bold text-lg outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})} />
                            <Phone size={20} className="text-gray-300" />
                        </div>
                    </div>
                    
                    {/* Security Question Field - ONLY for Signup/Reset */}
                    {mode !== 'login' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-2">{t.security_question}</label>
                            <div className="p-3 bg-orange-50 rounded-xl text-xs font-bold text-orange-700 border border-orange-100 mb-2 leading-relaxed">
                                {t.security_hint}
                            </div>
                            <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                <input className="bg-transparent w-full font-bold outline-none" placeholder={t.enter_village} value={form.secretA} onChange={e => setForm({...form, secretA: e.target.value})} />
                                <HelpCircle size={20} className="text-gray-300" />
                            </div>
                        </div>
                    )}

                    {/* Password Field */}
                    <div className="space-y-1">
                        <div className="flex justify-between px-2">
                            <label className="text-xs font-bold text-gray-400">{t.password}</label>
                            {mode === 'login' && <button onClick={() => setMode('reset')} className="text-xs font-bold text-orange-600">{t.forgot_password}</button>}
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                            <input type={showPass ? "text" : "password"} className="bg-transparent w-full font-bold text-lg outline-none" value={mode === 'reset' ? form.newPass : form.password} onChange={e => setForm(mode === 'reset' ? {...form, newPass: e.target.value} : {...form, password: e.target.value})} />
                            <button onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={20} className="text-gray-400"/> : <Eye size={20} className="text-gray-400"/>}</button>
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-xl">{error}</div>}
                    
                    <button onClick={handleAuth} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
                        {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? t.login : mode === 'signup' ? t.create_now : t.save)}
                    </button>
                    
                    <div className="text-center pt-2">
                        {mode === 'login' ? (
                            <p className="text-sm text-gray-500 font-bold">
                                Don't have an account? <button onClick={() => setMode('signup')} className="text-orange-600 hover:underline font-extrabold text-base ml-1">{t.create_now}</button>
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 font-bold">
                                Already have an account? <button onClick={() => setMode('login')} className="text-orange-600 hover:underline font-extrabold text-base ml-1">{t.login}</button>
                            </p>
                        )}
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}