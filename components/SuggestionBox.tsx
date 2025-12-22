'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from './ProfileContext';
import { Send, Image as ImageIcon, Loader2, CheckCircle2, MessageSquare, Clock, CheckCheck } from 'lucide-react';

export default function SuggestionBox() {
  const { profile, language } = useProfile();
  
  const [category, setCategory] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myMessages, setMyMessages] = useState<any[]>([]);

  // 1. Reduced Categories
  const categories = [
    "Suggestion (सुझाव)",
    "Complaint (शिकायत)",
    "Personal (निजी समस्या)"
  ];

  useEffect(() => {
    fetchMyMessages();
  }, [profile.name]);

  const fetchMyMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        const { data } = await supabase.from('messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if(data) setMyMessages(data);
    }
  };

  const handleSubmit = async () => {
    if (!message) return alert("Please write a message");
    if (!profile.name) { window.dispatchEvent(new Event('open-auth')); return; }

    setLoading(true);
    let imageUrl = null;

    try {
        if (image) {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
            const formData = new FormData();
            formData.append('file', image);
            formData.append('upload_preset', uploadPreset || '');
            formData.append('folder', 'sevadar_complaints');
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
            const json = await res.json();
            if (json.secure_url) imageUrl = json.secure_url;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('messages').insert({
                user_id: user.id,
                category: category,
                content: message,
                image_url: imageUrl,
                status: 'pending' // Default
            });
            setSuccess(true);
            setMessage('');
            setImage(null);
            fetchMyMessages(); // Refresh list
            setTimeout(() => setSuccess(false), 3000);
        }
    } catch (err) { console.error(err); alert("Failed. Try again."); }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
       {/* Form Section */}
       <div className="relative z-10 mb-8">
           <h3 className="font-bold text-gray-800 font-hindi flex items-center gap-2 mb-4">
               <MessageSquare size={20} className="text-blue-600" /> सीधा संवाद (Direct Contact)
           </h3>

           {success ? (
               <div className="bg-green-50 p-4 rounded-xl text-center text-green-700 font-bold mb-4 animate-in zoom-in">
                   <CheckCircle2 className="mx-auto mb-1"/> संदेश भेज दिया गया है!
               </div>
           ) : (
               <div className="space-y-3">
                   <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl p-3 outline-none">
                       {categories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="अपनी समस्या या सुझाव यहाँ लिखें..." className="w-full bg-gray-50 border border-gray-200 text-gray-800 p-3 rounded-xl h-24 outline-none font-hindi resize-none"/>
                   <div className="flex items-center gap-3">
                       <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer ${image ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
                           <ImageIcon size={18} /><span className="text-xs font-bold truncate">{image ? image.name : "Photo"}</span>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setImage(e.target.files[0])} />
                       </label>
                       <button onClick={handleSubmit} disabled={loading} className="flex-[2] bg-blue-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2">
                           {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send <Send size={16} /></>}
                       </button>
                   </div>
               </div>
           )}
       </div>

       {/* History Section */}
       {myMessages.length > 0 && (
           <div className="border-t pt-4">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Previous Messages</h4>
               <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                   {myMessages.map(m => (
                       <div key={m.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                           <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-bold text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                               <div className="flex items-center gap-1">
                                   {m.status === 'pending' && <span className="text-orange-500 text-[10px] font-bold flex items-center gap-1"><Clock size={10}/> Sent</span>}
                                   {(m.status === 'read' || m.status === 'replied') && <span className="text-blue-600 text-[10px] font-bold flex items-center gap-1"><CheckCheck size={12}/> Seen by Admin</span>}
                               </div>
                           </div>
                           <p className="text-xs text-gray-800 font-hindi line-clamp-2">{m.content}</p>
                           
                           {/* Auto Notification / Reply */}
                           {(m.status === 'read' || m.status === 'replied') && (
                               <div className="mt-2 bg-white p-2 rounded-lg border border-blue-100 animate-in slide-in-from-left">
                                   <p className="text-[10px] text-gray-500 italic mb-1">
                                       {language === 'hi' 
                                         ? "ब्रजेश तिवारी जी ने आपका संदेश देखा है और वे आपके विश्वास के लिए आभारी हैं।" 
                                         : "Brijesh Tiwari Ji has seen your message and is thankful for your trust."}
                                   </p>
                                   {m.admin_reply && (
                                       <div className="text-xs font-bold text-blue-800 mt-1 border-t pt-1 border-gray-100">
                                           Reply: {m.admin_reply}
                                       </div>
                                   )}
                               </div>
                           )}
                       </div>
                   ))}
               </div>
           </div>
       )}
    </div>
  );
}