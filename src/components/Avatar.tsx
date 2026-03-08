'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
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
          y: [0, -12, 0],
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
          rotate: [0, 8, -8, 0],
          scale: [1, 1.15, 1],
          backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6'],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'speaking':
        return {
          y: [0, -20, 0],
          scale: [1, 1.3, 1],
          backgroundColor: ['#f59e0b', '#fbbf24', '#f59e0b'],
          transition: {
            duration: 0.3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'connecting':
        return {
          scale: [1, 1.15, 1],
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
          x: [-8, 8, -8, 0],
          backgroundColor: ['#ef4444', '#f87171', '#ef4444'],
          transition: {
            duration: 0.5,
            repeat: 3,
            ease: "easeInOut" as const
          }
        };
      
      default:
        return {
          scale: 1,
          backgroundColor: '#10b981'
        };
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (state) {
      case 'idle':
        return 'Ready to learn!';
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
        className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full flex items-center justify-center shadow-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400"
        animate={animationConfig}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        
        {/* Massive Friendly Bot Face */}
        <div className="relative z-10">
          <Bot className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 text-white drop-shadow-2xl" />
          
          {/* Friendly animated eyes */}
          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className="flex gap-6 sm:gap-8">
              <motion.div
                className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg"
                animate={{
                  scale: state === 'listening' ? [1, 0.3, 1] : 1,
                  y: state === 'speaking' ? [0, -2, 0] : 0,
                }}
                transition={{
                  duration: 0.3,
                  repeat: state === 'listening' || state === 'speaking' ? Infinity : 0,
                  ease: "easeInOut" as const,
                }}
              />
              <motion.div
                className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg"
                animate={{
                  scale: state === 'listening' ? [1, 0.3, 1] : 1,
                  y: state === 'speaking' ? [0, -2, 0] : 0,
                }}
                transition={{
                  duration: 0.3,
                  repeat: state === 'listening' || state === 'speaking' ? Infinity : 0,
                  ease: "easeInOut" as const,
                }}
              />
            </div>
          </div>
          
          {/* Big friendly smile */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
            <motion.div
              className="w-16 h-8 sm:w-20 sm:h-10 border-b-6 border-white rounded-b-full shadow-lg"
              animate={{
                width: state === 'speaking' ? ['4rem', '6rem', '4rem'] : '4rem',
                height: state === 'speaking' ? ['2rem', '2.5rem', '2rem'] : '2rem',
              }}
              transition={{
                duration: 0.4,
                repeat: state === 'speaking' ? Infinity : 0,
                ease: "easeInOut" as const,
              }}
            />
          </div>
        </div>
        
        {/* Enhanced pulsing ring effect for active states */}
        {(state === 'listening' || state === 'speaking') && (
          <motion.div
            className="absolute inset-0 rounded-full border-6 border-white opacity-40"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />
        )}
      </motion.div>

      {/* Status text */}
      <motion.div
        className="mt-8 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 text-center"
        animate={{
          opacity: [0.6, 1, 0.6],
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
