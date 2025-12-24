'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Share2, Heart, Volume2, VolumeX, ArrowLeft, MessageCircle, X, Send, ShieldCheck, User, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
  profiles: { full_name: string; avatar_url: string; is_admin: boolean; };
}

// --- HELPERS ---
const awardPoints = async (userId: string, postId: string, action: 'share' | 'comment', updateProfile: any, currentPoints: number) => {
    const key = `points_${action}_${postId}`;
    if (localStorage.getItem(key)) return; 

    const { error } = await supabase.rpc('update_user_points', { p_user_id: userId, p_points: 1 });
    
    if (!error) {
        localStorage.setItem(key, 'true');
        updateProfile({ points: currentPoints + 1 });
    }
};

// --- SKELETON LOADING ---
const FeedSkeleton = () => (
  <div className="h-full w-full bg-black animate-pulse flex flex-col justify-end p-6">
    <div className="h-64 w-full bg-gray-900 mb-auto mx-auto rounded-lg"></div>
    <div className="h-6 w-3/4 bg-gray-800 rounded mb-3"></div>
    <div className="h-4 w-full bg-gray-800 rounded mb-2"></div>
    <div className="h-4 w-1/2 bg-gray-800 rounded"></div>
  </div>
);

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
      
      setPosts((data as unknown as FeedPost[]) || []);
      setLoading(false);
    }
    fetchFeed();
  }, []);

  const scrollToNextPost = (currentIndex: number) => {
    if (containerRef.current && currentIndex < posts.length - 1) {
        const nextPost = containerRef.current.children[currentIndex + 1] as HTMLElement;
        if (nextPost) nextPost.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return <div className="h-screen bg-black"><FeedSkeleton /></div>;

  return (
    <div className="fixed inset-0 bg-black z-40">
      <div className="absolute top-0 inset-x-0 z-50 p-4 pt-safe flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-3 pointer-events-auto">
             <Link href="/" className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition border border-white/10">
                <ArrowLeft size={20}/>
             </Link>
             <h1 className="text-lg font-bold text-white drop-shadow-md">Feed</h1>
         </div>
      </div>

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

function FeedItem({ post, index, onComplete }: { post: FeedPost, index: number, onComplete: () => void }) {
    const { profile, updateProfile } = useProfile();
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) awardPoints(user.id, post.id, 'share', updateProfile, profile.points || 0);

        const shareText = `${post.title}\n\n${post.description}\n\n📲 *Join Mission 2029 - Sevadar:*\nhttps://brijeshtiwari.in`;
        try {
            if (navigator.share) {
                if (post.images && post.images.length > 0 && navigator.canShare) {
                    try {
                        const response = await fetch(post.images[0]);
                        const blob = await response.blob();
                        const file = new File([blob], 'share.jpg', { type: 'image/jpeg' });
                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ files: [file], title: post.title, text: shareText });
                            return;
                        }
                    } catch(e) {}
                }
                await navigator.share({ title: post.title, text: shareText, url: "https://brijeshtiwari.in" });
            } else {
                navigator.clipboard.writeText(shareText);
                alert("Link copied!");
            }
        } catch(e) {}
    };

    return (
        <div ref={cardRef} className="h-full w-full snap-start relative bg-black overflow-hidden flex flex-col justify-center">
            {/* MEDIA LAYER */}
            <div className="absolute inset-0 z-0">
                {post.type === 'video' ? (
                    <SmartVideoPlayer post={post} isVisible={isVisible} onComplete={onComplete} />
                ) : (
                    <RobustCarousel post={post} isVisible={isVisible} onComplete={onComplete} />
                )}
            </div>
            
            {/* TEXT LAYER */}
            <div className="absolute inset-x-0 bottom-0 p-5 pb-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-20">
                <h2 className="text-xl font-bold text-white mb-2 font-hindi leading-tight drop-shadow-md">{post.title}</h2>
                <p className="text-sm text-gray-200 font-hindi leading-relaxed line-clamp-3 opacity-90">{post.description}</p>
            </div>

            {/* BUTTONS LAYER */}
            <div className="absolute bottom-24 right-3 z-30 flex flex-col gap-6 items-center">
                <div className="flex flex-col items-center gap-1">
                    <button onClick={handleLike} className="group active:scale-75 transition-transform">
                        <div className={`p-3 backdrop-blur-md rounded-full border transition-all ${liked ? 'bg-red-500/20 border-red-500' : 'bg-black/30 border-white/20'}`}>
                            <Heart size={28} className={`transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </div>
                    </button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{likeCount}</span>
                </div>
                <ActionButton icon={<Share2 size={24} />} label="Share" onClick={handleShare} />
                <ActionButton icon={<MessageCircle size={24} />} label="Comments" onClick={() => setShowComments(true)} />
            </div>

            {showComments && <CommentModal postId={post.id} onClose={() => setShowComments(false)} />}
        </div>
    );
}

// --- SMART VIDEO PLAYER (TAP TO PAUSE & OVERLAY) ---
function SmartVideoPlayer({ post, isVisible, onComplete }: { post: FeedPost, isVisible: boolean, onComplete: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [muted, setMuted] = useState(false);
    const [isYouTube, setIsYouTube] = useState(false);
    const [ytId, setYtId] = useState('');
    const [overlayIcon, setOverlayIcon] = useState<'play' | 'pause' | null>(null);

    useEffect(() => {
        if (post.url && (post.url.includes('youtube.com') || post.url.includes('youtu.be'))) {
            setIsYouTube(true);
            const match = post.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
            if (match) setYtId(match[1]);
        } else { setIsYouTube(false); }
    }, [post.url]);

    useEffect(() => {
        if (!isYouTube && videoRef.current) {
            if (isVisible) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        setMuted(true);
                        if(videoRef.current) {
                            videoRef.current.muted = true;
                            videoRef.current.play().catch(()=>{});
                        }
                    });
                }
            } else {
                videoRef.current.pause();
                setOverlayIcon(null); // Clear icons when scrolled away
            }
        }
    }, [isVisible, isYouTube]);

    // TOGGLE PLAY/PAUSE LOGIC
    const handleVideoClick = (e: React.MouseEvent) => {
        if (!videoRef.current) return;
        
        if (videoRef.current.paused) {
            videoRef.current.play();
            setOverlayIcon('play');
        } else {
            videoRef.current.pause();
            setOverlayIcon('pause');
        }

        // Hide icon after 1 second
        setTimeout(() => setOverlayIcon(null), 1000);
    };

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
            {isYouTube && ytId ? (
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=${isVisible ? 1 : 0}&mute=${muted ? 1 : 0}&controls=0&loop=0&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&showinfo=0`}
                    className="w-full h-[120%] scale-110 pointer-events-none"
                    allow="autoplay; encrypted-media"
                    title="Video"
                />
            ) : (
                <>
                    <video
                        ref={videoRef}
                        src={post.url}
                        className="w-full h-full object-cover" 
                        loop={false}
                        muted={muted}
                        playsInline
                        onEnded={onComplete} // SCROLL WHEN DONE
                        onClick={handleVideoClick} // TAP TO PLAY/PAUSE
                    />

                    {/* PLAY/PAUSE OVERLAY ICON */}
                    {overlayIcon && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-in fade-in zoom-in duration-200">
                            <div className="bg-black/40 p-4 rounded-full backdrop-blur-md">
                                {overlayIcon === 'play' ? (
                                    <Play size={48} className="text-white fill-white" />
                                ) : (
                                    <Pause size={48} className="text-white fill-white" />
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {/* MUTE BUTTON - Standard Click Event */}
            <button 
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} 
                className="absolute top-20 right-4 z-[60] p-2 bg-black/40 rounded-full backdrop-blur-sm border border-white/10 active:scale-95 transition-transform"
            >
                {muted ? <VolumeX size={20} className="text-white"/> : <Volume2 size={20} className="text-white"/>}
            </button>
        </div>
    );
}

// --- ROBUST CAROUSEL (UNCHANGED) ---
function RobustCarousel({ post, isVisible, onComplete }: { post: FeedPost, isVisible: boolean, onComplete: () => void }) {
    const images = post.images || [];
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    
    useEffect(() => {
        if (!isVisible) setActiveIndex(0);
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible || paused || images.length <= 1) return;
        const timer = setTimeout(() => {
            if (activeIndex < images.length - 1) {
                setActiveIndex(prev => prev + 1);
            } else {
                onComplete();
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [isVisible, paused, activeIndex, images.length, onComplete]);

    const handleTap = (direction: 'prev' | 'next') => {
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

    if (images.length === 0) return null;

    return (
        <div 
            className="relative w-full h-full bg-black flex items-center justify-center"
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
        >
            {images.length > 1 && (
                <div className="absolute top-16 inset-x-2 flex gap-1 z-30">
                    {images.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-white origin-left ${i === activeIndex ? 'animate-progress' : ''}`}
                                style={{ 
                                    width: i < activeIndex ? '100%' : i === activeIndex ? 'auto' : '0%',
                                    animationDuration: '5000ms',
                                    animationPlayState: paused ? 'paused' : 'running',
                                    display: i === activeIndex ? 'block' : undefined 
                                }} 
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={() => handleTap('prev')} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={() => handleTap('next')} />

            <div className="relative w-full h-full">
                <Image src={images[activeIndex]} alt={`Slide ${activeIndex}`} fill className="object-contain" priority={activeIndex === 0} />
            </div>
            
            <style jsx>{`
                @keyframes progress { from { width: 0%; } to { width: 100%; } }
                .animate-progress { animation-name: progress; animation-timing-function: linear; animation-fill-mode: forwards; }
            `}</style>
        </div>
    );
}

// --- COMMENTS ---
function CommentModal({ postId, onClose }: { postId: string, onClose: () => void }) {
    const { profile, updateProfile } = useProfile();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            const { data } = await supabase.from('feed_comments').select('*, profiles(full_name, avatar_url, is_admin)').eq('post_id', postId).order('created_at', { ascending: false }); 
            if (data) setComments(data as any);
            setLoading(false);
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.dispatchEvent(new Event('open-auth')); setSending(false); return; }

        awardPoints(user.id, postId, 'comment', updateProfile, profile.points || 0);

        const { error } = await supabase.from('feed_comments').insert({ post_id: postId, user_id: user.id, content: newComment });
        if (!error) {
            setNewComment('');
            const { data } = await supabase.from('feed_comments').select('*, profiles(full_name, avatar_url, is_admin)').eq('post_id', postId).order('created_at', { ascending: false });
            if (data) setComments(data as any);
        }
        setSending(false);
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/60 animate-in fade-in duration-200">
            <div className="h-[60vh] bg-white rounded-t-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Comments ({comments.length})</h3>
                    <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"><X size={16} className="text-gray-600"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400"/></div> : comments.map(c => (
                        <div key={c.id} className="flex gap-3 animate-in slide-in-from-bottom-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                                {c.profiles?.avatar_url ? <Image src={c.profiles.avatar_url} alt="User" fill className="object-cover"/> : <User className="p-1 w-full h-full text-gray-400"/>}
                            </div>
                            <div className="flex-1 bg-gray-50 p-3 rounded-2xl rounded-tl-none text-sm border border-gray-100">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="font-bold text-xs text-gray-900">{c.profiles?.full_name || 'User'}</span>
                                    {c.profiles?.is_admin && <span className="bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><ShieldCheck size={10}/> Admin</span>}
                                </div>
                                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">{c.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t bg-white flex gap-2 items-center pb-24 md:pb-4">
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-full px-4 py-3 text-sm outline-none transition-all"
                    />
                    <button 
                        onClick={handleSubmit} 
                        disabled={sending || !newComment.trim()}
                        className="p-3 bg-blue-600 rounded-full text-white disabled:opacity-50 active:scale-90 transition-transform shadow-lg shadow-blue-500/30"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
            <div className="p-3 bg-black/30 backdrop-blur-md rounded-full border border-white/20 group-hover:bg-white/10 shadow-sm">
                <div className="text-white">{icon}</div>
            </div>
            {label && <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{label}</span>}
        </button>
    );
}