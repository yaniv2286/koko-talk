'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import { useVoiceStore } from '@/store/voiceStore';
import { useRealtimeAudio } from '@/hooks/useRealtimeAudio';

interface ControlsProps {
  className?: string;
}

export const Controls = ({ className = '' }: ControlsProps) => {
  const { state, isConnected } = useVoiceStore();
  const { startRecording, stopRecording, connect, disconnect } = useRealtimeAudio();

  // Determine button state and behavior
  const getButtonConfig = () => {
    if (!isConnected) {
      return {
        text: 'Start Session',
        icon: <Play className="w-8 h-8 sm:w-10 sm:h-10" />,
        action: connect,
        disabled: state === 'connecting',
        color: 'bg-blue-500 hover:bg-blue-600',
        pulseColor: 'bg-blue-400',
      };
    }

    if (state === 'idle') {
      return {
        text: 'Talk to Koko',
        icon: <Mic className="w-8 h-8 sm:w-10 sm:h-10" />,
        action: startRecording,
        disabled: false,
        color: 'bg-green-500 hover:bg-green-600',
        pulseColor: 'bg-green-400',
      };
    }

    if (state === 'listening') {
      return {
        text: 'Stop Recording',
        icon: <MicOff className="w-8 h-8 sm:w-10 sm:h-10" />,
        action: stopRecording,
        disabled: false,
        color: 'bg-red-500 hover:bg-red-600',
        pulseColor: 'bg-red-400',
      };
    }

    if (state === 'thinking' || state === 'speaking') {
      return {
        text: state === 'thinking' ? 'Thinking...' : 'Speaking...',
        icon: state === 'thinking' ? 
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-t-4 border-gray-300 border-t-white rounded-full animate-spin" /> :
          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
          </div>,
        action: undefined,
        disabled: true,
        color: 'bg-gray-500',
        pulseColor: 'bg-gray-400',
      };
    }

    if (state === 'error') {
      return {
        text: 'Try Again',
        icon: <Play className="w-8 h-8 sm:w-10 sm:h-10" />,
        action: connect,
        disabled: false,
        color: 'bg-orange-500 hover:bg-orange-600',
        pulseColor: 'bg-orange-400',
      };
    }

    return {
      text: 'Connecting...',
      icon: <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-t-4 border-gray-300 border-t-white rounded-full animate-spin" />,
      action: undefined,
      disabled: true,
      color: 'bg-gray-500',
      pulseColor: 'bg-gray-400',
    };
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
      {/* Main Action Button */}
      <motion.button
        className={`
          relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 
          rounded-full 
          ${buttonConfig.color} 
          text-white 
          font-bold 
          text-lg sm:text-xl md:text-2xl
          shadow-2xl
          disabled:opacity-50
          disabled:cursor-not-allowed
          transition-colors
          duration-200
          flex
          flex-col
          items-center
          justify-center
          gap-2
          select-none
          active:scale-95
        `}
        onClick={handleButtonPress}
        onMouseUp={handleButtonRelease}
        onTouchEnd={handleButtonRelease}
        disabled={buttonConfig.disabled}
        whileHover={{ scale: buttonConfig.disabled ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
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

        {/* Icon */}
        <div className="flex-shrink-0">
          {buttonConfig.icon}
        </div>

        {/* Text */}
        <span className="text-center leading-tight">
          {buttonConfig.text}
        </span>
      </motion.button>

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
