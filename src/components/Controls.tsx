'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2, Play, Square } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import { useRealtimeAudio } from '@/hooks/useRealtimeAudio';

interface ControlsProps {
  className?: string;
}

export const Controls = ({ className = '' }: ControlsProps) => {
  const { state, isConnected } = useVoiceStore();
  const { startRecording, stopRecording, connect, disconnect } = useRealtimeAudio();

  // Get button configuration based on current state
  const getButtonConfig = () => {
    switch (state) {
      case 'idle':
        return {
          text: 'Start',
          icon: <Play className="w-6 h-6 sm:w-8 sm:h-8" />,
          action: isConnected ? startRecording : connect,
          disabled: false,
        };
      
      case 'connecting':
        return {
          text: 'Connecting',
          icon: <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />,
          action: undefined,
          disabled: true,
        };
      
      case 'listening':
        return {
          text: 'Listening',
          icon: <Mic className="w-6 h-6 sm:w-8 sm:h-8" />,
          action: stopRecording,
          disabled: false,
        };
      
      case 'thinking':
        return {
          text: 'Thinking',
          icon: <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />,
          action: undefined,
          disabled: true,
        };
      
      case 'speaking':
        return {
          text: 'Speaking',
          icon: <Square className="w-6 h-6 sm:w-8 sm:h-8" />,
          action: undefined,
          disabled: true,
        };
      
      case 'error':
        return {
          text: 'Try Again',
          icon: <MicOff className="w-6 h-6 sm:w-8 sm:h-8" />,
          action: connect,
          disabled: false,
        };
      
      default:
        return {
          text: 'Start',
          icon: <Play className="w-6 h-6 sm:w-8 sm:h-8" />,
          action: undefined,
          disabled: true,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  // Handle button interactions
  const handleButtonPress = () => {
    if (buttonConfig.action && !buttonConfig.disabled) {
      buttonConfig.action();
    }
  };

  const handleButtonRelease = () => {
    // For future implementation: could support push-to-talk behavior
    // where releasing stops recording automatically
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Premium Glass Button */}
      <motion.button
        className={`
          relative px-12 py-6 sm:px-16 sm:py-8 md:px-20 md:py-10
          bg-white/60
          backdrop-blur-md
          border border-white/50
          shadow-lg
          rounded-full
          text-blue-600
          font-semibold
          text-lg sm:text-xl md:text-2xl
          flex
          items-center
          justify-center
          gap-4
          select-none
          transition-all duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
        onClick={handleButtonPress}
        onMouseUp={handleButtonRelease}
        onTouchEnd={handleButtonRelease}
        disabled={buttonConfig.disabled}
        whileHover={{ 
          scale: buttonConfig.disabled ? 1 : 1.05,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}
        whileTap={{ 
          scale: 0.95,
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <motion.div
          animate={{
            scale: state === 'listening' ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: state === 'listening' ? Infinity : 0,
            ease: "easeInOut" as const,
          }}
        >
          {buttonConfig.icon}
        </motion.div>
        
        <span>{buttonConfig.text}</span>
      </motion.button>

      {/* Status indicator */}
      <motion.div
        className="mt-6 text-sm sm:text-base text-slate-800 font-light text-center"
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      >
        {state === 'idle' && 'Tap to start learning'}
        {state === 'connecting' && 'Establishing connection...'}
        {state === 'listening' && 'Listening to your response...'}
        {state === 'thinking' && 'Processing your answer...'}
        {state === 'speaking' && 'Koko is speaking...'}
        {state === 'error' && 'Connection lost. Tap to retry.'}
      </motion.div>

      {/* Helper text for idle state */}
      {state === 'idle' && isConnected && (
        <motion.p
          className="mt-6 text-sm sm:text-base text-slate-600 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Click to start continuous conversation with Koko
        </motion.p>
      )}

      {/* Connection status */}
      {!isConnected && (
        <motion.p
          className="mt-6 text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Click "Start Session" to connect with Koko
        </motion.p>
      )}

      {/* Error message */}
      {state === 'error' && (
        <motion.p
          className="mt-6 text-sm sm:text-base text-red-600 dark:text-red-400 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Something went wrong. Click "Try Again" to reconnect.
        </motion.p>
      )}
    </div>
  );
};
