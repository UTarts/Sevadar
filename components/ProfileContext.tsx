'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { translations } from '@/lib/translations';

interface UserProfile {
  name: string;
  designation: string;
  village: string;
  photo: string | null;
  setup_complete: boolean;
  points: number;
  is_admin: boolean;
}

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
  isLoaded: boolean;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: any;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'hi'>('hi');
  const [profile, setProfile] = useState<UserProfile>({ 
    name: '', designation: '', village: '', photo: null, setup_complete: true, points: 0, is_admin: false 
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('app_lang');
    if (storedLang === 'en' || storedLang === 'hi') setLanguageState(storedLang);

    const storedProfile = localStorage.getItem('user_profile');
    if (storedProfile) setProfile(JSON.parse(storedProfile));
    
    fetchLatestFromDB();
  }, []);

  const setLanguage = (lang: 'en' | 'hi') => {
      setLanguageState(lang);
      localStorage.setItem('app_lang', lang);
  };

  const t = translations[language];

  const fetchLatestFromDB = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
       const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
       if (data) {
           const newProfile = { 
               name: data.full_name || '', 
               designation: data.designation || '', 
               village: data.village || '', 
               photo: data.avatar_url,
               setup_complete: data.setup_complete || false,
               points: data.points || 0,
               is_admin: data.is_admin === true
           };
           setProfile(newProfile);
           localStorage.setItem('user_profile', JSON.stringify(newProfile));
       }
    } else {
        // --- VITAL FIX: Guests are considered "Complete" so Wizard doesn't show ---
        setProfile({ 
            name: '', designation: '', village: '', photo: null, 
            setup_complete: true, // <--- THIS MUST BE TRUE FOR GUESTS
            points: 0, is_admin: false 
        });
    }
    setIsLoaded(true);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile((prev) => {
      const newProfile = { ...prev, ...data };
      localStorage.setItem('user_profile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isLoaded, language, setLanguage, t }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
};