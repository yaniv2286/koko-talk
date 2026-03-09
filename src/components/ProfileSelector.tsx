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
  // Define characters array before state that references them
  const characters = [
    {
      id: 'avatar1',
      name: 'Koko the Dog',
      avatar: '/avatars/cute-dog-studio.jpg',
      color: 'bg-green-100 hover:bg-green-200',
      borderColor: 'border-green-300'
    },
    {
      id: 'avatar2',
      name: 'Morah Sarah',
      avatar: '/avatars/Gemini_Generated_Image_sndvtosndvtosndv.png',
      color: 'bg-purple-100 hover:bg-purple-200',
      borderColor: 'border-purple-300'
    },
    {
      id: 'avatar3',
      name: 'Moreh Dan',
      avatar: '/avatars/Gemini_Generated_Image_4xj7d14xj7d14xj7.png',
      color: 'bg-amber-100 hover:bg-amber-200',
      borderColor: 'border-amber-300'
    }
  ];

  const { setProfile, kidGender, userProfile } = useVoiceStore();

  const handleCharacterSelect = (character: typeof characters[0]) => {
    console.log('� IGNITION: Calling', character.name);
    
    // Triple-Action Click - Execute all three commands simultaneously
    const userProfile = {
      id: `${kidGender}-${character.id}`,
      name: character.name,
      avatar: character.avatar,
    };
    
    console.log('👤 Setting profile:', userProfile);
    setProfile(userProfile);
    
    console.log('🔄 Switching to call view');
    onProfileSelected(); // This changes the view to Call Screen
    
    console.log('🔗 Triggering WebRTC connection');
    connect(); // This triggers the WebRTC audio engine
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
          Choose your Koko!
        </h1>
        
        <p className="text-lg sm:text-xl text-purple-200 mb-2">
          Pick your character friend! 🎭
        </p>
        
        <p className="text-sm text-gray-300">
          Which character do you want to learn with?
        </p>
      </motion.div>

      {/* Avatar Selection Grid */}
      <div className="w-full max-w-6xl">
        {/* Guard clause for avatar grid safety */}
        {!characters || characters.length === 0 ? (
          <div className="text-center text-white text-xl">
            Loading Teachers...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 w-full max-w-6xl mb-12">
            {characters.map((character, index) => (
              <motion.div
                key={character.id}
                className={`
                  relative rounded-2xl p-4 sm:p-6
                  bg-white/10 backdrop-blur-md border border-white/20 shadow-lg
                  cursor-pointer
                  transition-all duration-300
                  hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                  hover:scale-105
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCharacterSelect(character)}
              >
                {/* Character Image */}
                <div className="flex justify-center mb-4">
                  <div className={`
                    w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
                    rounded-full 
                    ${character.color}
                    border-2 ${character.borderColor}
                    flex items-center justify-center
                    overflow-hidden
                  `}>
                    {character.avatar && (
                      <img 
                        src={character.avatar} 
                        alt={character.name}
                        className="w-full h-full object-contain"
                        onLoad={() => console.log('🖼️ Avatar loaded:', character.avatar)}
                        onError={() => console.error('🖼️ Avatar failed to load:', character.avatar)}
                      />
                    )}
                  </div>
                </div>

                {/* Character Name */}
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white text-center mb-2">
                  {character.name}
                </h2>

                {/* Selection indicator */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                    <span className="text-white text-xs sm:text-sm">→</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
