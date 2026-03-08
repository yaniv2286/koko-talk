'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, User, Users, Sparkles } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import { AgeGroup } from '@/store/voiceStore';

interface ProfileSelectorProps {
  className?: string;
  onProfileSelected: () => void;
}

export const ProfileSelector = ({ className = '', onProfileSelected }: ProfileSelectorProps) => {
  const { setProfile } = useVoiceStore();
  const [step, setStep] = useState<'age' | 'character'>('age');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);

  const profiles = [
    {
      id: 'little-kids',
      name: 'Little Kids',
      ageGroup: '4-7' as AgeGroup,
      icon: <Baby className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" />,
      description: 'Ages 4-7',
      color: 'bg-pink-500 hover:bg-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
      borderColor: 'border-pink-300 dark:border-pink-700',
      features: [
        '🌟 Very simple words',
        '🐢 Speak slowly',
        '🎉 Super enthusiastic',
        '🧸 Fun games'
      ]
    },
    {
      id: 'big-kids',
      name: 'Big Kids',
      ageGroup: '8-12' as AgeGroup,
      icon: <User className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" />,
      description: 'Ages 8-12',
      color: 'bg-blue-500 hover:bg-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      borderColor: 'border-blue-300 dark:border-blue-700',
      features: [
        '🚀 Cool vocabulary',
        '⚡ Normal speed',
        '😎 Witty & fun',
        '📚 Grammar help'
      ]
    }
  ];

  const characters = [
    {
      id: 'puppy',
      name: 'Puppy',
      avatar: '/avatars/puppy.png',
      color: 'bg-amber-100 hover:bg-amber-200',
      borderColor: 'border-amber-300'
    },
    {
      id: 'robot',
      name: 'Robot',
      avatar: '/avatars/robot.png',
      color: 'bg-blue-100 hover:bg-blue-200',
      borderColor: 'border-blue-300'
    },
    {
      id: 'monster',
      name: 'Monster',
      avatar: '/avatars/monster.png',
      color: 'bg-green-100 hover:bg-green-200',
      borderColor: 'border-green-300'
    }
  ];

  const handleAgeSelect = (profile: typeof profiles[0]) => {
    setSelectedAgeGroup(profile.ageGroup);
    setStep('character');
  };

  const handleCharacterSelect = (character: typeof characters[0]) => {
    const userProfile = {
      id: `${selectedAgeGroup}-${character.id}`,
      name: `${selectedAgeGroup === '4-7' ? 'Little Kid' : 'Big Kid'}`,
      ageGroup: selectedAgeGroup as AgeGroup,
      avatar: character.avatar,
    };

    setProfile(userProfile);
    onProfileSelected();
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {/* Header */}
      <motion.div
        className="text-center mb-12 max-w-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center mb-4">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          >
            <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500" />
          </motion.div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-slate-800 mb-4">
          {step === 'age' ? 'Welcome to Koko Talk!' : 'Choose your Koko!'}
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-800 mb-2">
          {step === 'age' ? 'Choose your learning adventure 🎓' : 'Pick your character friend! 🎭'}
        </p>
        
        <p className="text-sm sm:text-base text-slate-600">
          {step === 'age' ? 'Pick the right level for you' : 'Which character do you want to learn with?'}
        </p>
      </motion.div>

      {/* Step 1: Age Selection */}
      {step === 'age' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              className={`
                relative rounded-2xl p-8 sm:p-10 md:p-12
                bg-white/60 backdrop-blur-md border border-white/50 shadow-lg
                cursor-pointer
                transition-all duration-300
                hover:shadow-xl
                hover:scale-105
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAgeSelect(profile)}
            >
              {/* Profile Icon */}
              <div className="flex justify-center mb-6">
                <div className={`
                  w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32
                  rounded-full 
                  ${profile.color}
                  flex items-center justify-center
                  text-white
                  shadow-lg
                `}>
                  {profile.icon}
                </div>
              </div>

              {/* Profile Name */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-800 text-center mb-2">
                {profile.name}
              </h2>

              {/* Description */}
              <p className="text-lg sm:text-xl text-slate-600 text-center mb-6">
                {profile.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                {profile.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="text-sm sm:text-base text-slate-700 text-center"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Step 2: Character Selection */}
      {step === 'character' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-12">
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              className={`
                relative rounded-2xl p-8
                bg-white/60 backdrop-blur-md border border-white/50 shadow-lg
                cursor-pointer
                transition-all duration-300
                hover:shadow-xl
                hover:scale-105
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCharacterSelect(character)}
            >
              {/* Character Image */}
              <div className="flex justify-center mb-6">
                <div className={`
                  w-24 h-24 sm:w-32 sm:h-32
                  rounded-full 
                  ${character.color}
                  border-2 ${character.borderColor}
                  flex items-center justify-center
                  overflow-hidden
                `}>
                  <img 
                    src={character.avatar} 
                    alt={character.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Character Name */}
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 text-center mb-2">
                {character.name}
              </h2>

              {/* Selection indicator */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Back button for character selection */}
      {step === 'character' && (
        <motion.button
          className="px-6 py-3 bg-white/60 backdrop-blur-md border border-white/50 rounded-full text-slate-700 font-medium hover:bg-white/80 transition-all duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => setStep('age')}
        >
          ← Back to Age Selection
        </motion.button>
      )}
    </div>
  );
};
