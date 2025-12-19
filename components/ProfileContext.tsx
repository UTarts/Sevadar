'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  name: string;
  designation: string;
  photo: string | null; // Data URL of the cropped image
}

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    designation: '',
    photo: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Local Storage on startup
  useEffect(() => {
    const saved = localStorage.getItem('mission2029_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to Local Storage whenever profile changes
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('mission2029_profile', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isLoaded }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}