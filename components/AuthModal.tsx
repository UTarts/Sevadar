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
            if (!form.phone || !form.password || !form.secretA) throw new Error("All fields required");
            const { error: upError } = await supabase.auth.signUp({
                email, password: form.password,
                options: { data: { secret_answer: form.secretA.toLowerCase().trim() } }
            });
            if (upError) throw upError;
            
            // Auto Login Logic
            const { error: signError } = await supabase.auth.signInWithPassword({ email, password: form.password });
            if (!signError) {
                // Initialize Profile
                const { data: { user } } = await supabase.auth.getUser();
                if(user) {
                    await supabase.from('profiles').upsert({ id: user.id, full_name: 'User', points: 50 });
                    updateProfile({ setup_complete: false }); // Trigger Wizard
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
            // 1. Verify Secret Answer (Mock check via RPC or generic match if user exists)
            // Since Supabase doesn't expose users securely client-side, this is a simplified flow.
            // For production, use Edge Function. Here assuming simple flow:
            
            // WARNING: Client-side secret check is limited. 
            // Better strategy: We can't query auth.users. 
            // We'll rely on the user knowing the data to update it once logged in, 
            // OR use a specific RPC function 'verify_secret' if you created one.
            // FOR NOW: Simulating success if fields are filled (You need backend support for true recovery without email)
            
            if(!form.secretA || !form.newPass) throw new Error("Fill all fields");
            
            // Admin/Backend usually handles this. 
            // Fallback for this demo: prompt user we can't reset without SMS/Email in this setup 
            // UNLESS you have the 'update_password_by_secret' RPC we discussed before.
            
            // Let's assume you added the RPC or logic. 
            // If not, we will just show error:
            setError("Recovery requires Admin contact or RPC setup.");
        }
    } catch (err: any) {
        setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X size={20} /></button>

            {view === 'language' ? (
                <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-3xl">🕉️</div>
                    <h2 className="text-2xl font-bold font-hindi text-gray-900">भाषा चुनें / Choose Language</h2>
                    <div className="space-y-3">
                        <button onClick={() => { setLanguage('hi'); setView('auth'); }} className="w-full p-4 rounded-xl border-2 border-orange-100 hover:border-orange-500 bg-orange-50 hover:bg-orange-100 transition-all flex items-center justify-between group">
                            <span className="text-lg font-bold text-gray-800">हिंदी (Hindi)</span>
                            <Check className={`text-orange-600 ${language === 'hi' ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                        <button onClick={() => { setLanguage('en'); setView('auth'); }} className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 bg-gray-50 hover:bg-blue-50 transition-all flex items-center justify-between group">
                            <span className="text-lg font-bold text-gray-800">English</span>
                            <Check className={`text-blue-600 ${language === 'en' ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 font-hindi">
                            {mode === 'login' ? t.welcome : mode === 'signup' ? t.start_sevadar : t.recover_account}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 font-bold">Mission 2029 - Pratapgarh</p>
                    </div>

                    <div className="space-y-3">
                        {/* Phone Input */}
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3 focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all">
                            <Phone size={20} className="text-gray-400" />
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{t.phone_number}</p>
                                <input autoFocus value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-transparent outline-none font-bold text-gray-800" placeholder="9876543210" type="tel" maxLength={10} />
                            </div>
                        </div>

                        {/* Password or Secret Answer Logic */}
                        {mode !== 'reset' ? (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3 focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all">
                                <div className="text-gray-400"><HelpCircle size={20}/></div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{t.password}</p>
                                    <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-transparent outline-none font-bold text-gray-800" type={showPass ? "text" : "password"} placeholder="••••••" />
                                </div>
                                <button onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={20} className="text-gray-400"/> : <Eye size={20} className="text-gray-400"/>}</button>
                            </div>
                        ) : null}

                        {/* Secret Question Field (For Signup or Reset) */}
                        {(mode === 'signup' || mode === 'reset') && (
                            <div className="space-y-2">
                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                                    <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">{t.security_question}</p>
                                    <p className="text-xs text-orange-900 font-medium leading-relaxed">{t.security_hint}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                                    <div className="text-gray-400">🔒</div>
                                    <input 
                                        value={form.secretA} 
                                        onChange={e => setForm({...form, secretA: e.target.value})} 
                                        className="w-full bg-transparent outline-none font-bold text-gray-800 text-sm" 
                                        placeholder={t.enter_village} // "Enter Village Name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reset New Password Field */}
                        {mode === 'reset' && (
                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                                <div className="text-gray-400">🔑</div>
                                <input value={form.newPass} onChange={e => setForm({...form, newPass: e.target.value})} className="w-full bg-transparent outline-none font-bold text-gray-800" type="text" placeholder={t.set_new_password} />
                             </div>
                        )}
                    </div>

                    {/* Forgot Password Link */}
                    {mode === 'login' && (
                        <div className="flex justify-end">
                            <button onClick={() => setMode('reset')} className="text-xs font-bold text-gray-500 hover:text-primary transition-colors">{t.forgot_password}</button>
                        </div>
                    )}

                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-xl border border-red-100">{error}</div>}
                    
                    <button onClick={handleAuth} disabled={loading} className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 shadow-xl shadow-gray-200 active:scale-95 transition-transform">
                        {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? t.login : mode === 'signup' ? t.create_now : t.update_password)}
                    </button>
                    
                    <div className="text-center pt-2">
                        {mode === 'login' ? (
                            <p className="text-sm text-gray-500 font-bold">
                                Don't have an account? <button onClick={() => setMode('signup')} className="text-primary hover:underline font-extrabold text-base ml-1">{t.create_now}</button>
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 font-bold">
                                Already have an account? <button onClick={() => setMode('login')} className="text-primary hover:underline font-extrabold text-base ml-1">{t.login}</button>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}