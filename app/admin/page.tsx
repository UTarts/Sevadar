'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/components/ProfileContext';
import { 
  Search, Download, LogOut, Loader2, User, 
  Send, Trash2, Video, Plus, Check, 
  MessageSquare, CheckCircle2, Calendar, Phone, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, isLoaded, updateProfile } = useProfile();
  
  const [activeTab, setActiveTab] = useState<'users' | 'feed' | 'polls' | 'quiz' | 'suggestions'>('users');
  const [loading, setLoading] = useState(true);

  // --- DATA STATES ---
  const [users, setUsers] = useState<any[]>([]);
  const [existingPosts, setExistingPosts] = useState<any[]>([]);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // --- FORMS & UI STATES ---
  const [search, setSearch] = useState('');
  
  // Suggestions UI State
  const [replyText, setReplyText] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);

  // Feed Form
  const [feedTitle, setFeedTitle] = useState('');
  const [feedDesc, setFeedDesc] = useState('');
  const [feedType, setFeedType] = useState<'image' | 'video'>('image');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedFiles, setFeedFiles] = useState<File[]>([]); 
  const [uploading, setUploading] = useState(false);

  // Poll Form
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Quiz Form
  const [quizDate, setQuizDate] = useState(new Date().toISOString().split('T')[0]);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [quizCorrectIdx, setQuizCorrectIdx] = useState(0);

  // --- AUTH CHECK ---
  useEffect(() => {
    if (isLoaded) {
        if (!profile.is_admin) router.push('/');
        else loadAllData();
    }
  }, [isLoaded, profile.is_admin]);

  // --- LOAD ALL DATA ---
  const loadAllData = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch Users
      const { data: u } = await supabase.from('profiles').select('*').order('points', { ascending: false });
      if (u) setUsers(u);
      
      // 2. Fetch Feed
      const { data: f } = await supabase.from('feed_posts').select('*').order('created_at', { ascending: false });
      if (f) setExistingPosts(f);

      // 3. Fetch Polls
      const { data: p } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
      if (p) setActivePolls(p);

      // 4. Fetch Quizzes (ONLY Today & Future)
      const { data: q } = await supabase.from('daily_quizzes')
          .select('*')
          .gte('date', today) // Filter: Date >= Today
          .order('date', { ascending: true }); // Show nearest date first
      if (q) setQuizzes(q);

      // 5. Fetch Messages (Suggestions)
      const { data: m } = await supabase.from('messages')
          .select('*, profiles(full_name, phone, avatar_url, village)')
          .order('created_at', { ascending: false });
      if (m) setMessages(m);

      setLoading(false);
  };

  // Helper: Format Date dd/mm/yyyy
  const formatDate = (dateString: string, includeTime = false) => {
      const date = new Date(dateString);
      if (includeTime) {
          return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // --- ACTIONS: USERS ---
  const filteredUsers = users.filter(u => 
      !u.is_admin && 
      (
          (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
          (u.phone || '').includes(search) || 
          (u.village || '').toLowerCase().includes(search.toLowerCase()) // Added Village Search
      )
  );

  const downloadUsersPDF = () => {
    const doc = new jsPDF();
    doc.text("Sevadar User List", 14, 15);
    const tableData = filteredUsers.map((u, i) => [
        i + 1, 
        u.full_name || '-', 
        u.phone || '-', 
        u.village || '-', 
        u.points || 0
    ]);
    autoTable(doc, { head: [['#', 'Name', 'Phone', 'Village', 'Points']], body: tableData, startY: 25 });
    doc.save('sevadar_users.pdf');
  };

  // --- ACTIONS: SUGGESTIONS ---
  const downloadSuggestionsPDF = () => {
    const doc = new jsPDF();
    doc.text("User Suggestions / Complaints", 14, 15);
    const tableData = messages.map((s, i) => [
        i + 1,
        s.profiles?.full_name || 'Unknown',
        s.profiles?.phone || '-',
        s.content || '-', 
        formatDate(s.created_at, true)
    ]);
    autoTable(doc, { head: [['#', 'User', 'Phone', 'Message', 'Date']], body: tableData, startY: 25 });
    doc.save('sevadar_suggestions.pdf');
  };

  const handleMarkRead = async (id: string) => {
      await supabase.from('messages').update({ status: 'read' }).eq('id', id);
      loadAllData();
  };

  const handleReply = async (id: string) => {
      if (!replyText) return;
      await supabase.from('messages').update({ 
          status: 'replied', 
          admin_reply: replyText 
      }).eq('id', id);
      setReplyingId(null);
      setReplyText('');
      loadAllData();
  };

  const deleteMessage = async (id: string) => {
      if(confirm("Delete this message?")) { 
          await supabase.from('messages').delete().eq('id', id); 
          loadAllData(); 
      }
  };

  // --- ACTIONS: FEED ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          setFeedFiles(prev => [...prev, ...newFiles]);
      }
  };

  const handleFeedSubmit = async () => {
      if (!feedTitle) return alert("Title required");
      setUploading(true);
      
      let imageUrls: string[] = [];
      let videoUrl = feedUrl;

      if (feedType === 'image' && feedFiles.length > 0) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
        
        for (const file of feedFiles) {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', uploadPreset || '');
            data.append('folder', 'sevadar_feed');
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
                const json = await res.json();
                if (json.secure_url) imageUrls.push(json.secure_url);
            } catch(e) { console.error("Upload failed", e); }
        }
      }

      const payload = {
          type: feedType,
          title: feedTitle,
          description: feedDesc,
          url: feedType === 'video' ? videoUrl : (imageUrls[0] || ''), 
          images: imageUrls 
      };

      const { error } = await supabase.from('feed_posts').insert(payload);
      if (!error) { 
          alert("Posted!"); 
          setFeedTitle(''); setFeedDesc(''); setFeedFiles([]); setFeedUrl('');
          loadAllData(); 
      }
      setUploading(false);
  };

  const deleteFeed = async (id: string) => {
      if(confirm("Delete?")) { await supabase.from('feed_posts').delete().eq('id', id); loadAllData(); }
  };

  // --- ACTIONS: POLLS ---
  const handlePollSubmit = async () => {
      const validOptions = pollOptions.filter(o => o.trim() !== '');
      if (!pollQuestion || validOptions.length < 2) return alert("Question + 2 Options required");
      const { error } = await supabase.from('polls').insert({ question: pollQuestion, options: validOptions, is_active: true });
      if (!error) { alert("Poll Created!"); setPollQuestion(''); setPollOptions(['', '']); loadAllData(); }
  };
  
  const deletePoll = async (id: string) => { 
      if(confirm("Delete?")) { await supabase.from('polls').delete().eq('id', id); loadAllData(); } 
  };

  // --- ACTIONS: QUIZ ---
  const handleQuizSubmit = async () => {
      if (!quizQuestion || quizOptions.some(o => !o)) return alert("Fill all fields");
      const { error } = await supabase.from('daily_quizzes').upsert({
          date: quizDate,
          question: quizQuestion,
          options: quizOptions,
          correct_index: quizCorrectIdx,
          points: 5
      }, { onConflict: 'date' });

      if (!error) { 
          alert("Quiz Saved for " + quizDate); 
          setQuizQuestion(''); setQuizOptions(['','','','']); 
          loadAllData();
      } else {
          alert("Error: " + error.message);
      }
  };

  const deleteQuiz = async (id: string) => {
      if(confirm("Delete this scheduled quiz?")) {
          await supabase.from('daily_quizzes').delete().eq('id', id);
          loadAllData();
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      updateProfile({ name: '', is_admin: false });
      router.push('/');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm border-b sticky top-0 z-20">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white">
                    <img 
                        src={profile.photo || '/logo.webp'} 
                        alt="Admin" 
                        className="w-full h-full object-cover" 
                        onError={(e) => e.currentTarget.src = '/logo.webp'} 
                    />
                 </div>
                 <div><h1 className="text-xl font-bold">Admin Panel</h1><p className="text-xs text-orange-600 font-bold">Brijesh Kumar Tiwari</p></div>
             </div>
             <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 rounded-full"><LogOut size={20}/></button>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {['users', 'feed', 'polls', 'quiz', 'suggestions'].map((t) => (
                  <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold capitalize whitespace-nowrap ${activeTab === t ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{t}</button>
              ))}
          </div>
      </div>

      <div className="p-4">
          
          {/* --- TAB: USERS --- */}
          {activeTab === 'users' && (
              <>
                <div className="flex justify-between mb-4">
                    <h2 className="text-lg font-bold">Users: {filteredUsers.length}</h2>
                    <button onClick={downloadUsersPDF} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2"><Download size={14}/> PDF</button>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                    <input className="w-full pl-10 pr-4 py-3 rounded-xl border" placeholder="Search Name, Phone, Village..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border h-[60vh] overflow-y-auto">
                    {filteredUsers.map(u => (
                        <div key={u.id} className="p-4 border-b flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0"><img src={u.avatar_url || '/placeholder-user.png'} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src='/placeholder-user.png'}/></div>
                            <div className="flex-1"><h3 className="font-bold">{u.full_name}</h3><p className="text-xs text-gray-500">{u.village} • {u.phone}</p></div>
                            <div className="text-xs font-bold text-orange-600">{u.points} Pts</div>
                        </div>
                    ))}
                </div>
              </>
          )}

          {/* --- TAB: SUGGESTIONS --- */}
          {activeTab === 'suggestions' && (
              <>
                <div className="flex justify-between mb-4">
                    <h2 className="text-lg font-bold">Inbox: {messages.length}</h2>
                    <button onClick={downloadSuggestionsPDF} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2"><Download size={14}/> PDF</button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border h-[65vh] overflow-y-auto">
                    {messages.length === 0 ? <div className="p-10 text-center text-gray-400">No messages yet.</div> : messages.map(s => (
                        <div key={s.id} className={`p-4 border-b ${s.status === 'pending' ? 'bg-orange-50/50' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0"><img src={s.profiles?.avatar_url || '/placeholder-user.png'} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src='/placeholder-user.png'}/></div>
                                    <div>
                                        <h3 className="font-bold text-sm">{s.profiles?.full_name || 'Unknown'}</h3>
                                        {/* Added Phone Number here */}
                                        <p className="text-[10px] text-gray-500 font-bold">{s.profiles?.phone}</p>
                                        <p className="text-[10px] text-gray-500">{s.profiles?.village} • {s.category}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {/* Date & Time Display */}
                                    <span className="text-[10px] text-gray-400 font-bold">{formatDate(s.created_at, true)}</span>
                                    <div className="flex gap-2 mt-1">
                                        {s.status === 'pending' && <button onClick={()=>handleMarkRead(s.id)} className="text-blue-600 bg-blue-50 p-1.5 rounded-lg text-xs font-bold">Mark Read</button>}
                                        {s.status === 'read' && <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Seen</span>}
                                        <button onClick={()=>deleteMessage(s.id)} className="text-red-500 p-1.5"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-xl mb-2 font-hindi">{s.content || s.message}</p>
                            {s.image_url && <img src={s.image_url} className="h-32 rounded-lg border mb-2" alt="attachment" />}

                            {s.admin_reply ? (
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                                    <span className="font-bold text-green-700 block mb-1">You Replied:</span>
                                    {s.admin_reply}
                                </div>
                            ) : (
                                <div className="mt-2">
                                    {replyingId === s.id ? (
                                        <div className="flex gap-2">
                                            <input autoFocus className="flex-1 border rounded-lg px-2 py-1 text-sm outline-none" placeholder="Type reply..." value={replyText} onChange={e=>setReplyText(e.target.value)}/>
                                            <button onClick={()=>handleReply(s.id)} className="bg-black text-white px-3 rounded-lg text-xs font-bold">Send</button>
                                            <button onClick={()=>setReplyingId(null)} className="text-gray-400"><X size={16}/></button>
                                        </div>
                                    ) : (
                                        <button onClick={()=>setReplyingId(s.id)} className="text-xs font-bold text-gray-400 hover:text-blue-600 underline">Reply to user</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
              </>
          )}

          {/* --- TAB: FEED --- */}
          {activeTab === 'feed' && (<div className="space-y-6"><div className="bg-white p-5 rounded-2xl shadow-sm border"><h3 className="font-bold mb-4">New Post</h3><div className="space-y-3"><div className="flex gap-2"><button onClick={()=>setFeedType('image')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${feedType==='image'?'bg-orange-50 border-orange-200':''}`}>Images</button><button onClick={()=>setFeedType('video')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${feedType==='video'?'bg-blue-50 border-blue-200':''}`}>Video</button></div><input value={feedTitle} onChange={e=>setFeedTitle(e.target.value)} placeholder="Title" className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold"/><textarea value={feedDesc} onChange={e=>setFeedDesc(e.target.value)} placeholder="Description..." className="w-full p-3 bg-gray-50 rounded-xl text-sm h-20"/>{feedType === 'image' ? (<div className="space-y-2"><label className="block w-full p-4 border-dashed border-2 rounded-xl text-center text-gray-400 cursor-pointer hover:bg-gray-50"><div className="flex flex-col items-center gap-1"><Plus size={24} /><span className="text-xs font-bold">Add Images</span></div><input type="file" multiple className="hidden" accept="image/*" onChange={handleFileSelect} /></label>{feedFiles.length>0&&<div className="flex gap-2 overflow-x-auto pb-2">{feedFiles.map((f,i)=>(<div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border"><img src={URL.createObjectURL(f)} className="w-full h-full object-cover"/><button onClick={()=>setFeedFiles(feedFiles.filter((_,ix)=>ix!==i))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={10}/></button></div>))}</div>}</div>) : ( <input value={feedUrl} onChange={e=>setFeedUrl(e.target.value)} placeholder="Video URL" className="w-full p-3 bg-gray-50 rounded-xl text-sm"/> )}<button onClick={handleFeedSubmit} disabled={uploading} className="w-full bg-black text-white py-3 rounded-xl font-bold flex justify-center gap-2">{uploading?<Loader2 className="animate-spin"/>:'Post'}</button></div></div><div className="space-y-3">{existingPosts.map(p => (<div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border flex gap-3"><div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">{p.type==='image'?<img src={p.images?.[0]||p.url} className="w-full h-full object-cover"/>:<Video className="m-auto mt-4 text-gray-400"/>}</div><div className="flex-1"><h4 className="font-bold text-sm line-clamp-1">{p.title}</h4><button onClick={()=>deleteFeed(p.id)} className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><Trash2 size={12}/> Delete</button></div></div>))}</div></div>)}
          {activeTab === 'polls' && (<div className="space-y-6"><div className="bg-white p-5 rounded-2xl shadow-sm border"><h3 className="font-bold mb-4">Create Poll</h3><input value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} placeholder="Question" className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold mb-3"/><div className="space-y-2 mb-4">{pollOptions.map((o,i)=>(<input key={i} value={o} onChange={e=>{const n=[...pollOptions];n[i]=e.target.value;setPollOptions(n)}} placeholder={`Option ${i+1}`} className="w-full p-2 bg-gray-50 rounded-lg text-sm"/>))}<button onClick={()=>setPollOptions([...pollOptions,''])} className="text-xs font-bold text-blue-600">+ Add Option</button></div><button onClick={handlePollSubmit} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Launch</button></div><div className="space-y-3">{activePolls.map(p => (<div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-start"><div><h4 className="font-bold text-sm">{p.question}</h4></div><button onClick={()=>deletePoll(p.id)} className="text-red-500"><Trash2 size={16}/></button></div>))}</div></div>)}
          
          {/* --- TAB: QUIZ (Updated) --- */}
          {activeTab === 'quiz' && (
              <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border">
                      <h3 className="font-bold mb-4">Question of the Day</h3>
                      <div className="mb-4">
                          <label className="text-xs font-bold text-gray-500 block mb-1">Date</label>
                          <input type="date" value={quizDate} onChange={e => setQuizDate(e.target.value)} className="w-full p-2 bg-gray-50 rounded-xl font-bold" />
                      </div>
                      <input value={quizQuestion} onChange={e=>setQuizQuestion(e.target.value)} placeholder="Question..." className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold mb-3"/>
                      <div className="space-y-2 mb-4">
                          {quizOptions.map((o,i)=>(
                              <div key={i} className="flex gap-2">
                                  <div onClick={() => setQuizCorrectIdx(i)} className={`w-10 flex items-center justify-center rounded-lg cursor-pointer border ${quizCorrectIdx === i ? 'bg-green-500 text-white border-green-600' : 'bg-gray-100 border-gray-200'}`}>
                                      {quizCorrectIdx === i ? <Check size={16}/> : i+1}
                                  </div>
                                  <input value={o} onChange={e=>{const n=[...quizOptions];n[i]=e.target.value;setQuizOptions(n)}} placeholder={`Option ${i+1}`} className="flex-1 p-2 bg-gray-50 rounded-lg text-sm"/>
                              </div>
                          ))}
                      </div>
                      <button onClick={handleQuizSubmit} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">Save Quiz</button>
                  </div>

                  <div className="space-y-3">
                      <h3 className="font-bold text-gray-800">Upcoming Quizzes</h3>
                      {quizzes.map(q => (
                          <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-start">
                              <div>
                                  <div className="flex justify-between mb-1">
                                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 rounded flex items-center gap-1">
                                          <Calendar size={10}/> {formatDate(q.date)}
                                      </span>
                                  </div>
                                  <h4 className="font-bold text-sm text-gray-800">{q.question}</h4>
                              </div>
                              <button onClick={() => deleteQuiz(q.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                          </div>
                      ))}
                      {quizzes.length === 0 && <div className="text-center text-gray-400 text-xs py-4">No upcoming quizzes scheduled.</div>}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}