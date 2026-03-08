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
          scale: [1, 1.05, 0.95, 1],
          borderRadius: ['50%', '45%', '55%', '50%'],
          boxShadow: [
            '0 0 40px rgba(99, 102, 241, 0.3)',
            '0 0 60px rgba(99, 102, 241, 0.4)',
            '0 0 40px rgba(99, 102, 241, 0.3)',
          ],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'listening':
        return {
          scale: [1, 1.15, 1.1, 1.15, 1],
          borderRadius: ['50%', '40%', '50%', '40%', '50%'],
          boxShadow: [
            '0 0 60px rgba(34, 197, 94, 0.4)',
            '0 0 80px rgba(34, 197, 94, 0.6)',
            '0 0 100px rgba(34, 197, 94, 0.4)',
          ],
          background: [
            'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.6))',
            'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.7))',
            'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.6))',
          ],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'thinking':
        return {
          scale: [1, 1.08, 1.02, 1.08, 1],
          borderRadius: ['50%', '48%', '52%', '48%', '50%'],
          rotate: [0, 2, -2, 0],
          boxShadow: [
            '0 0 50px rgba(59, 130, 246, 0.4)',
            '0 0 70px rgba(59, 130, 246, 0.5)',
            '0 0 50px rgba(59, 130, 246, 0.4)',
          ],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'speaking':
        return {
          scale: [1, 1.2, 0.9, 1.3, 1],
          borderRadius: ['50%', '35%', '65%', '30%', '50%'],
          boxShadow: [
            '0 0 80px rgba(251, 146, 60, 0.5)',
            '0 0 120px rgba(251, 146, 60, 0.7)',
            '0 0 100px rgba(251, 146, 60, 0.4)',
          ],
          background: [
            'linear-gradient(135deg, rgba(251, 146, 60, 0.8), rgba(245, 158, 11, 0.6))',
            'linear-gradient(135deg, rgba(251, 146, 60, 0.9), rgba(245, 158, 11, 0.7))',
            'linear-gradient(135deg, rgba(251, 146, 60, 0.8), rgba(245, 158, 11, 0.6))',
          ],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'connecting':
        return {
          scale: [1, 1.1, 0.95, 1.1, 1],
          opacity: [0.6, 1, 0.6, 1, 0.6],
          borderRadius: ['50%', '45%', '55%', '45%', '50%'],
          boxShadow: [
            '0 0 40px rgba(156, 163, 175, 0.3)',
            '0 0 60px rgba(156, 163, 175, 0.4)',
            '0 0 40px rgba(156, 163, 175, 0.3)',
          ],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      
      case 'error':
        return {
          scale: [1, 1.05, 0.95, 1.05, 1],
          borderRadius: ['50%', '40%', '60%', '40%', '50%'],
          x: [-3, 3, -3, 3, 0],
          boxShadow: [
            '0 0 50px rgba(239, 68, 68, 0.4)',
            '0 0 70px rgba(239, 68, 68, 0.6)',
            '0 0 50px rgba(239, 68, 68, 0.4)',
          ],
          transition: {
            duration: 1,
            repeat: 3,
            ease: "easeInOut" as const
          }
        };
      
      default:
        return {
          scale: 1,
          borderRadius: '50%',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)'
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

  const animationConfig = getAnimationConfig();

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Fluid AI Orb */}
      <motion.div
        className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64"
        animate={animationConfig}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Main Orb */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-indigo-400/80 via-purple-400/60 to-blue-400/40 backdrop-blur-sm"
          style={{
            borderRadius: '50%',
            boxShadow: '0 0 60px rgba(99, 102, 241, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.2)'
          }}
        />
        
        {/* Inner glow */}
        <div 
          className="absolute inset-4 bg-gradient-to-tr from-white/30 to-transparent backdrop-blur-md"
          style={{ borderRadius: '50%' }}
        />
        
        {/* Core light */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white/40 rounded-full backdrop-blur-sm"
            animate={{
              scale: state === 'listening' ? [1, 1.3, 1] : [1, 1.1, 1],
              opacity: state === 'listening' ? [0.6, 1, 0.6] : [0.8, 1, 0.8],
            }}
            transition={{
              duration: state === 'listening' ? 1 : 3,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />
        </div>
      </motion.div>

      {/* Status text */}
      <motion.div
        className="mt-12 text-lg sm:text-xl md:text-2xl font-medium text-slate-700 text-center tracking-wide"
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
