'use client';

import { motion } from 'framer-motion';
import { useVoiceStore } from '@/store/voiceStore';

interface AvatarProps {
  className?: string;
}

export const Avatar = ({ className = '' }: AvatarProps) => {
  const { state } = useVoiceStore();

  // Simple animation for the glowing orb
  const getOrbAnimation = () => {
    switch (state) {
      case 'idle':
        return {
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'listening':
        return {
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'thinking':
        return {
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'speaking':
        return {
          scale: [1, 1.3, 1],
          opacity: [0.9, 1, 0.9],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      default:
        return {
          scale: 1,
          opacity: 0.8
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
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-white shadow-xl rounded-full flex items-center justify-center">
        {/* Simple Glowing Blue Orb */}
        <motion.div
          className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-blue-500 rounded-full"
          animate={getOrbAnimation()}
          style={{
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
          }}
        />
        
        {/* Inner glow for depth */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-blue-400/50 rounded-full" />
        </div>
      </div>

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
