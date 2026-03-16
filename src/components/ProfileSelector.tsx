'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVoiceStore } from '@/store/voiceStore';

interface ProfileSelectorProps {
  className?: string;
  onProfileSelected: () => void;
  connect: () => void;
}

export const ProfileSelector = ({ className = '', onProfileSelected, connect }: ProfileSelectorProps) => {
  // Binary Tutor Selection: Dog or Cat
  const tutors = [
    {
      id: 'koko',
      name: 'Koko the Dog',
      image: '/avatars/cute-dog-studio.jpg',
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]'
    },
    {
      id: 'mimi',
      name: 'Mimi the Cat',
      image: '/avatars/cute-cat-studio.png',
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]'
    }
  ];

  const { setProfile, kidGender, userProfile, currentView } = useVoiceStore();

  const handleTutorSelect = async (tutor: typeof tutors[0]) => {
  // Prevent any default browser behavior
  if (typeof window !== 'undefined' && window.event) {
    window.event.preventDefault();
  }
  
  console.log('🚀 IGNITION: Calling', tutor.name);
  console.log('🚀 Before anything - currentView:', currentView);
  console.log('🚀 Before anything - store userProfile:', userProfile);
  console.log('🚀 Before anything - kidGender:', kidGender);
  
  // Binary Tutor Selection - Store tutorId for voice routing
  const newProfile = {
    id: tutor.id,
    name: tutor.name,
    avatar: tutor.image,
  };
  
  console.log('👤 Setting profile:', newProfile);
  setProfile(newProfile);
  
  console.log('🔄 Calling onProfileSelected callback');
  onProfileSelected(); // Call the callback instead of setCurrentView directly

  // Small delay to let React/Zustand settle before WebRTC heavy lifting
  setTimeout(async () => {
    console.log('2. Starting WebRTC Connection');
    console.log('🚀 After timeout - currentView:', currentView);
    console.log('🚀 After timeout - userProfile:', userProfile);
    await connect();
  }, 100);
};

  return (
    <div className={`flex flex-col items-center justify-center p-4 sm:p-8 font-sans ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-4">
          Choose Your Tutor!
        </h1>
        
        <p className="text-lg sm:text-xl text-purple-200 mb-2">
          Who do you want to learn English with? 🎓
        </p>
      </motion.div>

      {/* Binary Tutor Selection */}
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          {tutors.map((tutor, index) => (
            <motion.button
              type="button"
              key={tutor.id}
              className={`
                relative rounded-3xl p-8 sm:p-12
                bg-gradient-to-br ${tutor.color}
                cursor-pointer
                transition-all duration-300
                ${tutor.hoverColor}
                hover:scale-105
                shadow-2xl
                border-4 border-white/30
              `}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTutorSelect(tutor);
              }}
            >
              {/* Tutor Image */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                  <img
                    src={tutor.image}
                    alt={tutor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Tutor Name */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4">
                {tutor.name}
              </h2>

              {/* Selection Arrow */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                  <span className="text-white text-2xl">→</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
