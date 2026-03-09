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
      name: 'Boy',
      avatar: '/avatars/boy_avatar.png',
      color: 'bg-blue-100 hover:bg-blue-200',
      borderColor: 'border-blue-300'
    },
    {
      id: 'avatar2',
      name: 'Girl',
      avatar: '/avatars/girl_avatar.png',
      color: 'bg-pink-100 hover:bg-pink-200',
      borderColor: 'border-pink-300'
    },
    {
      id: 'avatar3',
      name: 'Character 3',
      avatar: '/avatars/cute-dog-studio.jpg',
      color: 'bg-green-100 hover:bg-green-200',
      borderColor: 'border-green-300'
    },
    {
      id: 'avatar4',
      name: 'Character 4',
      avatar: '/avatars/Gemini_Generated_Image_sndvtosndvtosndv.png',
      color: 'bg-purple-100 hover:bg-purple-200',
      borderColor: 'border-purple-300'
    },
    {
      id: 'avatar5',
      name: 'Character 5',
      avatar: '/avatars/Gemini_Generated_Image_4xj7d14xj7d14xj7.png',
      color: 'bg-amber-100 hover:bg-amber-200',
      borderColor: 'border-amber-300'
    }
  ];

  // HOIST ALL HOOKS TO TOP - Rules of Hooks compliance
  const [selectedCharacter, setSelectedCharacter] = useState<typeof characters[0] | null>(null);
  
  const { setProfile, kidGender, userProfile } = useVoiceStore();

  const handleCharacterSelect = (character: typeof characters[0]) => {
    console.log('🖼️ Selected Avatar Path:', character.avatar);
    setSelectedCharacter(character);
    
    const userProfile = {
      id: `${kidGender}-${character.id}`,
      name: character.name,
      avatar: character.avatar,
    };
    
    console.log('👤 Creating profile:', userProfile);
    setProfile(userProfile);
  };

  const handleStartCall = () => {
    console.log('🚀 Starting call with selected character...');
    onProfileSelected();
    connect();
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
                  ${selectedCharacter?.id === character.id ? 'ring-4 ring-green-500 ring-offset-2' : ''}
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
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${selectedCharacter?.id === character.id 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                    }`}>
                    <span className="text-white text-xs sm:text-sm">
                      {selectedCharacter?.id === character.id ? '✓' : '→'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Start Call Button - Only show when character is selected */}
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.button
            onClick={handleStartCall}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            🚀 Start Call with {selectedCharacter.name}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};
