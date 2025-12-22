'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Share2, Heart, Volume2, VolumeX, ArrowLeft, MoreVertical, Flag, AlertTriangle } from 'lucide-react';
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
  likes: number;     // From DB
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

      {/* Main Feed Container */}
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
    
    // Like State
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes || 0);
    const [showOptions, setShowOptions] = useState(false);

    // 1. Intersection Observer (Is this post on screen?)
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        }, { threshold: 0.6 });

        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    // 2. Check if already liked (On Load)
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

    // 3. Handle Like
    const handleLike = async () => {
        if (liked) return; // No unlike allowed
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Optimistic UI update done, now save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
             window.dispatchEvent(new Event('open-auth'));
             return; 
        }

        // Use the SQL function
        const { error } = await supabase.rpc('like_feed_post', { p_post_id: post.id });
        if (!error) {
            // Update local profile points
            updateProfile({ points: (profile.points || 0) + 1 });
        }
    };

    // 4. Handle Share
    const handleShare = async () => {
        const shareData = {
            title: "Mission 2029 - Sevadar",
            text: `${post.title}\n\n${post.description}\n\n📲 Download the App & Join the Mission:\nhttps://brijeshtiwari.in`,
            url: "https://brijeshtiwari.in"
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert("Link copied to clipboard!");
            }
        } catch (err) { console.log(err); }
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
                
                {/* OPTIONS */}
                <div className="relative">
                    <ActionButton icon={<MoreVertical size={24} />} label="" onClick={() => setShowOptions(!showOptions)} />
                    {showOptions && (
                        <div className="absolute bottom-0 right-12 w-32 bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in origin-bottom-right">
                            <button className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Flag size={14}/> Report
                            </button>
                            <button className="w-full text-left px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                <AlertTriangle size={14}/> Not Interested
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: WHATSAPP STYLE IMAGE CAROUSEL (With Swipe & Fixes) ---
function ImageCarousel({ post, isVisible, onComplete }: { post: FeedPost, isVisible: boolean, onComplete: () => void }) {
    const images = post.images || [];
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const DURATION = 5000;

    // Reset when post changes
    useEffect(() => {
        if (isVisible) {
            setActiveIndex(0);
            setProgress(0);
        }
    }, [isVisible, post.id]);

    // Timer Logic
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

    // Manual Navigation (Tap/Swipe)
    const navigate = (direction: 'next' | 'prev') => {
        setProgress(0); // Essential: Reset timer immediately
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

    // Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX;
        if (touchStartX.current - touchEndX.current > 50) navigate('next'); // Swipe Left
        if (touchStartX.current - touchEndX.current < -50) navigate('prev'); // Swipe Right
    };

    return (
        <div 
            className="relative w-full h-full"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Progress Bars */}
            {images.length > 1 && (
                <div className="absolute top-16 inset-x-2 flex gap-1 z-30">
                    {images.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white transition-all ease-linear"
                                style={{ width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%' }} 
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Tap Zones (Desktop/Click fallback) */}
            <div className="absolute inset-y-0 left-0 w-1/4 z-20" onClick={() => navigate('prev')} />
            <div className="absolute inset-y-0 right-0 w-1/4 z-20" onClick={() => navigate('next')} />

            <img src={images[activeIndex]} className="w-full h-full object-cover" alt="Post" />
        </div>
    );
}

// --- COMPONENT: SMART VIDEO PLAYER (YouTube + Native) ---
function SmartVideoPlayer({ post, isVisible, onComplete }: { post: FeedPost, isVisible: boolean, onComplete: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [muted, setMuted] = useState(true);
    const [isYouTube, setIsYouTube] = useState(false);
    const [ytId, setYtId] = useState('');

    useEffect(() => {
        // Detect YouTube
        if (post.url && (post.url.includes('youtube.com') || post.url.includes('youtu.be'))) {
            setIsYouTube(true);
            const match = post.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
            if (match) setYtId(match[1]);
        } else {
            setIsYouTube(false);
        }
    }, [post.url]);

    // Native Video Logic
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
                // YouTube Iframe (Shorts Optimized)
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=${isVisible ? 1 : 0}&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&showinfo=0`}
                    className="w-full h-[120%] scale-110 pointer-events-none" // Scale to hide UI
                    allow="autoplay; encrypted-media"
                    title="Video"
                />
            ) : (
                // Native Video
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

            {/* Mute/Unmute Button (Works for both) */}
            <button 
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} 
                className="absolute top-20 right-4 z-40 p-2 bg-black/40 rounded-full backdrop-blur-sm border border-white/10"
            >
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