'use client';

import { motion } from 'framer-motion';
import { useVoiceStore } from '@/store/voiceStore';

interface AvatarProps {
  className?: string;
}

export const Avatar = ({ className = '' }: AvatarProps) => {
  const { state } = useVoiceStore();

  // Animation configurations for each state
  const getAnimationConfig = () => {
    switch (state) {
      case 'idle':
        return {
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'listening':
        return {
          scale: [1, 1.2, 1],
          backgroundColor: ['#10b981', '#34d399', '#10b981'],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'thinking':
        return {
          rotate: [0, 360],
          scale: [1, 1.1, 1],
          backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6'],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear" as const
          }
        };
      
      case 'speaking':
        return {
          scale: [1, 1.3, 1.15, 1.25, 1],
          backgroundColor: ['#f59e0b', '#fbbf24', '#f59e0b'],
          transition: {
            duration: 0.3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'connecting':
        return {
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
          backgroundColor: ['#6b7280', '#9ca3af', '#6b7280'],
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'error':
        return {
          scale: [1, 1.05, 1],
          backgroundColor: ['#ef4444', '#f87171', '#ef4444'],
          transition: {
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      default:
        return {
          scale: 1,
          backgroundColor: '#6b7280'
        };
    }
  };

  // Get avatar content based on state
  const getAvatarContent = () => {
    switch (state) {
      case 'idle':
        return '😊';
      case 'listening':
        return '👂';
      case 'thinking':
        return '🤔';
      case 'speaking':
        return '🗣️';
      case 'connecting':
        return '🔄';
      case 'error':
        return '😕';
      default:
        return '🤖';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (state) {
      case 'idle':
        return 'Ready to talk!';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Oops! Try again';
      default:
        return 'Koko';
    }
  };

  const animationConfig = getAnimationConfig();

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Avatar Container */}
      <motion.div
        className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          backgroundColor: state === 'idle' ? '#10b981' : undefined,
        }}
        animate={animationConfig}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Avatar face/content */}
        <div className="relative z-10 text-6xl sm:text-7xl md:text-8xl">
          {getAvatarContent()}
        </div>
        
        {/* Pulsing ring effect for active states */}
        {(state === 'listening' || state === 'speaking') && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-current opacity-30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Status text */}
      <motion.div
        className="mt-8 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 text-center"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      >
        {getStatusText()}
      </motion.div>
    </div>
  );
};
