'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';

interface StarCounterProps {
  className?: string;
}

export const StarCounter = ({ className = '' }: StarCounterProps) => {
  const { starCount } = useVoiceStore();

  return (
    <motion.div
      className={`
        fixed top-4 right-4 sm:top-6 sm:right-6
        flex items-center gap-2
        px-4 py-2
        bg-gradient-to-r from-yellow-400 to-orange-400
        text-white
        rounded-full
        shadow-lg
        font-bold
        text-sm sm:text-base
        z-50
        ${className}
      `}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated Star */}
      <motion.div
        animate={{
          rotate: [0, 15, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      >
        <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
      </motion.div>
      
      {/* Star Count */}
      <span className="min-w-[2ch] text-center">
        {starCount}
      </span>

      {/* Sparkle effect */}
      {starCount > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full bg-yellow-300 opacity-30"
          animate={{
            scale: [1, 1.5, 1],
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
  );
};
