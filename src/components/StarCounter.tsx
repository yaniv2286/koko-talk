'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';

interface StarCounterProps {
  className?: string;
}

export const StarCounter = ({ className = '' }: StarCounterProps) => {
  const { starCount } = useVoiceStore();

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`
          flex items-center gap-2
          px-4 py-2
          bg-white/10 backdrop-blur-md border border-white/20
          text-white
          rounded-full
          shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
          font-bold
          text-sm sm:text-base
          z-50
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
          <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-yellow-400" />
        </motion.div>
        
        {/* Star Count */}
        <span className="min-w-[2ch] text-center">
          {starCount}
        </span>

        {/* Sparkle effect */}
        {starCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full bg-yellow-400/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />
        )}
      </motion.div>

      {/* Magic Animation - Star burst when count increments */}
      <AnimatePresence>
        {starCount > 0 && (
          <motion.div
            key={starCount}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: [1, 2, 2.5],
              opacity: [1, 0.5, 0]
            }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut"
            }}
          >
            <motion.div
              className="w-8 h-8 bg-yellow-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                boxShadow: [
                  "0 0 0 0 rgba(250, 204, 21, 0.7)",
                  "0 0 0 10px rgba(250, 204, 21, 0)",
                  "0 0 0 0 rgba(250, 204, 21, 0)"
                ]
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
