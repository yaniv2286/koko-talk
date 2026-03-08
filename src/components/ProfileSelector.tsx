'use client';

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

  const handleProfileSelect = (profile: typeof profiles[0]) => {
    const userProfile = {
      id: profile.id,
      name: profile.name,
      ageGroup: profile.ageGroup,
    };

    setProfile(userProfile);
    onProfileSelected();
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 ${className}`}>
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
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
          Welcome to Koko Talk!
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2">
          Choose your learning adventure 🎓
        </p>
        
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Pick the right level for you
        </p>
      </motion.div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.id}
            className={`
              relative rounded-2xl p-8 sm:p-10 md:p-12
              ${profile.bgColor} 
              border-2 ${profile.borderColor}
              cursor-pointer
              transition-all duration-300
              hover:shadow-2xl
              hover:scale-105
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleProfileSelect(profile)}
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white text-center mb-2">
              {profile.name}
            </h2>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 text-center mb-6">
              {profile.description}
            </p>

            {/* Features */}
            <div className="space-y-2">
              {profile.features.map((feature, featureIndex) => (
                <motion.div
                  key={featureIndex}
                  className="flex items-center justify-center text-sm sm:text-base text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.2 + featureIndex * 0.1 }}
                >
                  <span className="mr-2">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="flex items-center justify-center mb-4">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mr-2" />
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Join thousands of kids learning English with Koko!
          </p>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
          Made with ❤️ for young learners everywhere
        </p>
      </motion.div>
    </div>
  );
};
