'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Share2, Heart, Volume2, VolumeX, ArrowLeft, MessageCircle, X, Send, ShieldCheck, User, MoreVertical, Flag, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/components/ProfileContext';

// --- TYPES ---
interface FeedPost {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  url: string;       
  images: string[]; 
  created_at: string;
  likes: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    is_admin: boolean;
  };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchFeed() {
      const { data } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      setPosts(data || []);
      setLoading(false);
    }
    fetchFeed();
  }, []);

  const scrollToNextPost = (currentIndex: number) => {
    if (containerRef.current && currentIndex < posts.length - 1) {
        const nextPost = containerRef.current.children[currentIndex + 1] as HTMLElement;
        if (nextPost) {
            nextPost.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="fixed inset-0 bg-black z-40">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-50 p-4 pt-safe flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-3 pointer-events-auto">
             <Link href="/" className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition">
                <ArrowLeft size={20}/>
             </Link>
             <h1 className="text-lg font-bold text-white drop-shadow-md">Feed</h1>
         </div>
      </div>

      {/* Main Feed Container - REMOVED pb-20 to fix layout shift */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar" 
      >
        {posts.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <p>No updates yet</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded-full text-sm text-white">Refresh</button>
           </div>
        ) : (
           posts.map((post, index) => (
             <FeedItem 
                key={post.id} 
                post={post} 
                index={index}
                onComplete={() => scrollToNextPost(index)}
             />
           ))
        )}
      </div>
    </div>
  );
}

// --- INDIVIDUAL FEED ITEM ---
function FeedItem({ post, index, onComplete }: { post: FeedPost, index: number, onComplete: () => void }) {
    const { profile, updateProfile } = useProfile();
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    
    // States
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes || 0);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        }, { threshold: 0.6 });

        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const checkLike = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('feed_likes').select('*').eq('post_id', post.id).eq('user_id', user.id).single();
                if (data) setLiked(true);
            }
        };
        if (isVisible) checkLike();
    }, [isVisible, post.id]);

    const handleLike = async () => {
        if (liked) return; 
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.dispatchEvent(new Event('open-auth')); return; }

        const { error } = await supabase.rpc('like_feed_post', { p_post_id: post.id });
        if (!error) updateProfile({ points: (profile.points || 0) + 1 });
    };

    const handleShare = async () => {
        const shareData = {
            title: "Mission 2029 - Sevadar",
            text: `${post.title}\n\n${post.description}\n\n📲 Download the App & Join the Mission:\nhttps://brijeshtiwari.in`,
            url: "https://brijeshtiwari.in"
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                copyToClipboard(shareData.text);
            }
        } else {
            copyToClipboard(shareData.text);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Link copied to clipboard! Share it anywhere.");
        }).catch(() => alert("Could not copy link."));
    };

    return (
        <div ref={cardRef} className="h-full w-full snap-start relative bg-gray-900 overflow-hidden">
            {post.type === 'video' ? (
                <SmartVideoPlayer post={post} isVisible={isVisible} onComplete={onComplete} />
            ) : (
                <ImageCarousel post={post} isVisible={isVisible} onComplete={onComplete} />
            )}
            
            {/* Overlay Info */}
            <div className="absolute inset-x-0 bottom-0 p-5 pb-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-20">
                <h2 className="text-xl font-bold text-white mb-2 font-hindi leading-tight drop-shadow-md">{post.title}</h2>
                <p className="text-sm text-gray-200 font-hindi leading-relaxed line-clamp-3 opacity-90">{post.description}</p>
            </div>

            {/* Right Side Actions */}
            <div className="absolute bottom-24 right-3 z-30 flex flex-col gap-6 items-center">
                {/* LIKE */}
                <div className="flex flex-col items-center gap-1">
                    <button onClick={handleLike} className="group active:scale-75 transition-transform">
                        <div className={`p-3 backdrop-blur-md rounded-full border transition-all ${liked ? 'bg-red-500/20 border-red-500' : 'bg-black/20 border-white/20'}`}>
                            <Heart size={28} className={`transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </div>
                    </button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{likeCount}</span>
                </div>

                {/* SHARE */}
                <ActionButton icon={<Share2 size={24} />} label="Share" onClick={handleShare} />
                
                {/* COMMENTS */}
                <ActionButton icon={<MessageCircle size={24} />} label="Comments" onClick={() => setShowComments(true)} />
            </div>

            {/* COMMENT MODAL */}
            {showComments && (
                <CommentModal postId={post.id} onClose={() => setShowComments(false)} />
            )}
        </div>
    );
}

// --- COMMENT MODAL (FIXED Z-INDEX) ---
function CommentModal({ postId, onClose }: { postId: string, onClose: () => void }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            const { data } = await supabase
                .from('feed_comments')
                .select('*, profiles(full_name, avatar_url, is_admin)')
                .eq('post_id', postId)
                .order('created_at', { ascending: false }); 
            if (data) setComments(data);
            setLoading(false);
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            window.dispatchEvent(new Event('open-auth'));
            setSending(false);
            return;
        }

        const { error } = await supabase.from('feed_comments').insert({
            post_id: postId,
            user_id: user.id,
            content: newComment
        });

        if (!error) {
            setNewComment('');
            const { data } = await supabase
                .from('feed_comments')
                .select('*, profiles(full_name, avatar_url, is_admin)')
                .eq('post_id', postId)
                .order('created_at', { ascending: false });
            if (data) setComments(data);
        }
        setSending(false);
    };

    return (
        // KEY FIX: z-[100] puts this modal ABOVE the Bottom Nav Bar
        <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/60 animate-in fade-in duration-200">
            <div className="h-[65vh] bg-white rounded-t-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">
                
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Comments ({comments.length})</h3>
                    <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"><X size={16} className="text-gray-600"/></button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400"/></div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm mt-10">No comments yet. Be the first!</p>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                    {c.profiles?.avatar_url ? (
                                        <img src={c.profiles.avatar_url} className="w-full h-full object-cover"/>
                                    ) : (
                                        <User className="p-1 w-full h-full text-gray-400"/>
                                    )}
                                </div>
                                <div className="flex-1 bg-gray-50 p-3 rounded-2xl rounded-tl-none text-sm border border-gray-100">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="font-bold text-xs text-gray-900">{c.profiles?.full_name || 'User'}</span>
                                        {c.profiles?.is_admin && (
                                            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <ShieldCheck size={10}/> Admin
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 leading-snug">{c.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area  */}
                <div className="p-3 border-t bg-gray-50 flex gap-2 items-center pb-24 md:pb-4">
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-3 text-sm outline-none focus:border-blue-500 shadow-sm"
                    />
                    <button 
                        onClick={handleSubmit} 
                        disabled={sending || !newComment.trim()}
                        className="p-3 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-90 transition-transform"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- EXISTING COMPONENTS (Carousel, Video, Button - Unchanged) ---
function ImageCarousel({ post, isVisible, onComplete }: { post: FeedPost, isVisible: boolean, onComplete: () => void }) {
    const images = post.images || [];
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const DURATION = 5000;

    useEffect(() => {
        if (isVisible) { setActiveIndex(0); setProgress(0); }
    }, [isVisible, post.id]);

    useEffect(() => {
        if (!isVisible || images.length === 0) return;
        const interval = setInterval(() => {
            setProgress(old => {
                if (old >= 100) {
                    if (activeIndex < images.length - 1) {
                        setActiveIndex(prev => prev + 1);
                        return 0; 
                    } else {
                        clearInterval(interval);
                        onComplete(); 
                        return 100;
                    }
                }
                return old + (100 / (DURATION / 100));
            });
        }, 100);
        return () => clearInterval(interval);
    }, [isVisible, activeIndex, images.length]);

    const navigate = (direction: 'next' | 'prev') => {
        setProgress(0);
        if (direction === 'prev') {
            setActiveIndex(prev => Math.max(0, prev - 1));
        } else {
            if (activeIndex < images.length - 1) {
                setActiveIndex(prev => prev + 1);
            } else {
                onComplete();
            }
        }
    };

    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX;
        if (touchStartX.current - touchEndX.current > 50) navigate('next');
        if (touchStartX.current - touchEndX.current < -50) navigate('prev');
    };

    return (
        <div className="relative w-full h-full" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {images.length > 1 && (
                <div className="absolute top-16 inset-x-2 flex gap-1 z-30">
                    {images.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all ease-linear" style={{ width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%' }} />
                        </div>
                    ))}
                </div>
            )}
            <div className="absolute inset-y-0 left-0 w-1/4 z-20" onClick={() => navigate('prev')} />
            <div className="absolute inset-y-0 right-0 w-1/4 z-20" onClick={() => navigate('next')} />
            <img src={images[activeIndex]} className="w-full h-full object-cover" alt="Post" />
        </div>
    );
}

function SmartVideoPlayer({ post, isVisible, onComplete }: { post: FeedPost, isVisible: boolean, onComplete: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [muted, setMuted] = useState(true);
    const [isYouTube, setIsYouTube] = useState(false);
    const [ytId, setYtId] = useState('');

    useEffect(() => {
        if (post.url && (post.url.includes('youtube.com') || post.url.includes('youtu.be'))) {
            setIsYouTube(true);
            const match = post.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
            if (match) setYtId(match[1]);
        } else {
            setIsYouTube(false);
        }
    }, [post.url]);

    useEffect(() => {
        if (!isYouTube && videoRef.current) {
            if (isVisible) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible, isYouTube]);

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
            {isYouTube && ytId ? (
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=${isVisible ? 1 : 0}&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&showinfo=0`}
                    className="w-full h-[120%] scale-110 pointer-events-none"
                    allow="autoplay; encrypted-media"
                    title="Video"
                />
            ) : (
                <video
                    ref={videoRef}
                    src={post.url}
                    className="w-full h-full object-cover"
                    loop={false}
                    muted={muted}
                    playsInline
                    onEnded={onComplete}
                    onClick={() => setMuted(!muted)}
                />
            )}
            <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="absolute top-20 right-4 z-40 p-2 bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
                {muted ? <VolumeX size={20} className="text-white"/> : <Volume2 size={20} className="text-white"/>}
            </button>
        </div>
    );
}

function ActionButton({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
            <div className="p-3 bg-black/20 backdrop-blur-md rounded-full border border-white/20 group-hover:bg-white/10">
                <div className="text-white">{icon}</div>
            </div>
            {label && <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{label}</span>}
        </button>
    );
}