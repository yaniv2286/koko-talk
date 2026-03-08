'use client';

import { motion } from 'framer-motion';
import { useVoiceStore } from '@/store/voiceStore';

interface AvatarProps {
  className?: string;
}

export const Avatar = ({ className = '' }: AvatarProps) => {
  const { state, userProfile } = useVoiceStore();

  // Debug logging
  console.log('🖼️ Current Avatar Path:', userProfile?.avatar);
  console.log('🖼️ User Profile:', userProfile);

  // Animation for the avatar based on state
  const getAvatarAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          y: [0, -8, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'listening':
        return {
          scale: [1, 1.1, 1],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'thinking':
        return {
          rotate: [0, 5, -5, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'speaking':
        return {
          y: [0, -12, 0],
          scale: [1, 1.2, 1],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      default:
        return {
          scale: 1,
          y: 0
        };
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (state) {
      case 'idle':
        return 'Ready to learn';
      case 'listening':
        return 'Listening';
      case 'thinking':
        return 'Thinking';
      case 'speaking':
        return 'Speaking';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Try again';
      default:
        return 'Koko';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Clean Avatar Container */}
      <motion.div 
        className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-white shadow-xl rounded-full flex items-center justify-center"
        animate={{
          scale: [1, 1.05, 0.95, 1],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        }}
      >
        {/* User's Selected Character Avatar */}
        <motion.img
          src={userProfile?.avatar || '/koko.png'} 
          alt='Character Avatar' 
          className='w-full h-full object-contain'
          animate={getAvatarAnimation()}
          onLoad={() => console.log('🖼️ Main avatar loaded:', userProfile?.avatar)}
          onError={() => console.error('🖼️ Main avatar failed to load:', userProfile?.avatar)}
        />
      </motion.div>

      {/* Status text */}
      <motion.div
        className="mt-12 text-lg sm:text-xl md:text-2xl font-medium text-slate-800 text-center"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      >
        {getStatusText()}
      </motion.div>
    </div>
  );
};
