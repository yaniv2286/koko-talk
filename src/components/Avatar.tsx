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
          y: [0, -8, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'listening':
        return {
          scale: [1, 1.15, 1],
          backgroundColor: ['#10b981', '#34d399', '#10b981'],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'thinking':
        return {
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1],
          backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6'],
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
          backgroundColor: ['#f59e0b', '#fbbf24', '#f59e0b'],
          transition: {
            duration: 0.4,
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
          x: [-5, 5, -5, 0],
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
        className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center shadow-2xl bg-gradient-to-br from-green-400 to-blue-500"
        animate={animationConfig}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        
        {/* Friendly Bot Face */}
        <div className="relative z-10">
          <Bot className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-white drop-shadow-lg" />
          
          {/* Friendly eyes overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-4 sm:gap-6">
              <motion.div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"
                animate={{
                  scale: state === 'listening' ? [1, 0.5, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  repeat: state === 'listening' ? Infinity : 0,
                  ease: "easeInOut" as const,
                }}
              />
              <motion.div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"
                animate={{
                  scale: state === 'listening' ? [1, 0.5, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  repeat: state === 'listening' ? Infinity : 0,
                  ease: "easeInOut" as const,
                }}
              />
            </div>
          </div>
          
          {/* Friendly smile */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <motion.div
              className="w-12 h-6 sm:w-16 sm:h-8 border-b-4 border-white rounded-b-full"
              animate={{
                width: state === 'speaking' ? ['3rem', '4rem', '3rem'] : '3rem',
              }}
              transition={{
                duration: 0.5,
                repeat: state === 'speaking' ? Infinity : 0,
                ease: "easeInOut" as const,
              }}
            />
          </div>
        </div>
        
        {/* Pulsing ring effect for active states */}
        {(state === 'listening' || state === 'speaking') && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-white opacity-30"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3],
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
