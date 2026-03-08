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
      {/* Glass Control Panel */}
      <motion.button
        className={`
          relative w-64 h-20 sm:w-80 sm:h-24 md:w-96 md:h-28 
          rounded-3xl
          bg-white/20
          backdrop-blur-xl
          border border-white/30
          shadow-xl
          disabled:opacity-50
          disabled:cursor-not-allowed
          transition-all duration-300
          flex
          items-center
          justify-center
          gap-4
          select-none
          overflow-hidden
        `}
        style={{
          boxShadow: state === 'listening' 
            ? '0 20px 40px rgba(34, 197, 94, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.2)'
            : '0 10px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          background: buttonConfig.disabled 
            ? 'rgba(255, 255, 255, 0.1)'
            : state === 'listening'
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))'
              : state === 'speaking'
                ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(245, 158, 11, 0.1))'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))'
        }}
        onClick={handleButtonPress}
        onMouseUp={handleButtonRelease}
        onTouchEnd={handleButtonRelease}
        disabled={buttonConfig.disabled}
        whileHover={{ 
          scale: buttonConfig.disabled ? 1 : 1.02,
          boxShadow: buttonConfig.disabled ? 'none' : '0 15px 35px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)'
        }}
        whileTap={{ 
          scale: 0.98,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Subtle inner glow */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent)',
          }}
        />
        
        {/* Button content */}
        <div className="relative z-10 flex items-center justify-center gap-4">
          <motion.div
            animate={{
              scale: state === 'listening' ? [1, 1.1, 1] : 1,
              opacity: state === 'listening' ? [0.8, 1, 0.8] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat: state === 'listening' ? Infinity : 0,
              ease: "easeInOut" as const,
            }}
            className="text-slate-700"
          >
            {buttonConfig.icon}
          </motion.div>
          
          <motion.span
            className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 tracking-wide"
            animate={{
              opacity: buttonConfig.disabled ? 0.6 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {buttonConfig.text}
          </motion.span>
        </div>

        {/* Subtle shimmer effect on hover */}
        {!buttonConfig.disabled && (
          <motion.div
            className="absolute inset-0 opacity-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            }}
            whileHover={{
              opacity: 1,
              x: ['0%', '100%'],
            }}
            transition={{
              x: { duration: 0.6, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.2 }
            }}
          />
        )}
      </motion.button>

      {/* Status indicator */}
      <motion.div
        className="mt-6 text-sm sm:text-base text-slate-600 font-light tracking-wide text-center"
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
          className="mt-6 text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Tap and hold to talk to Koko, or just tap to toggle recording
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
