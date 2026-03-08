'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/Avatar';
import { Controls } from '@/components/Controls';
import { ProfileSelector } from '@/components/ProfileSelector';
import { StarCounter } from '@/components/StarCounter';
import { VisualAid } from '@/components/VisualAid';
import { useVoiceStore } from '@/store/voiceStore';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

export default function Home() {
  const { userProfile, kidGender, setKidGender, state, audioLevel, disconnect } = useVoiceStore();
  const [showMainApp, setShowMainApp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [showDebugDrawer, setShowDebugDrawer] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl' | null>(null);

  const handleProfileSelected = () => {
    // Profile selected, will show gender selection next
  };

  const handleGenderSelected = () => {
    setShowMainApp(true);
  };

  const handleGenderSelect = (gender: 'boy' | 'girl') => {
    setSelectedGender(gender);
    setKidGender(gender);
    setTimeout(() => {
      handleGenderSelected();
    }, 300); // Brief delay to show selection animation
  };

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showMainApp && state === 'listening') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showMainApp, state]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show ProfileSelector if no profile is selected
  if (!userProfile) {
    return <ProfileSelector onProfileSelected={handleProfileSelected} />;
  }

  // Show Gender Selection if profile is selected but gender is not
  if (!kidGender) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
        {/* Blurred Background */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
              Koko
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 font-medium drop-shadow">
              One more thing before we start...
            </p>
          </div>

          {/* 3D Avatar Selection */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 mb-8 justify-center items-center">
            {/* Boy Avatar */}
            <div className="relative group">
              <button
                onClick={() => handleGenderSelect('boy')}
                className="relative transform transition-all duration-300 hover:scale-105 focus:outline-none"
              >
                {/* Selection Halo */}
                <AnimatePresence>
                  {selectedGender === 'boy' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 rounded-full bg-green-400/20 blur-xl"
                    />
                  )}
                </AnimatePresence>
                
                {/* Checkmark */}
                <AnimatePresence>
                  {selectedGender === 'boy' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 010-1.414l8-8z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Avatar Container */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-1 shadow-2xl shadow-blue-500/50 group-hover:shadow-blue-500/70">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src="/avatars/boy_avatar.png"
                      alt="Boy Avatar"
                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
                
                {/* Label */}
                <div className="mt-6 text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-blue-400 drop-shadow-lg">
                    I am a Boy
                  </h3>
                </div>
              </button>
            </div>

            {/* Girl Avatar */}
            <div className="relative group">
              <button
                onClick={() => handleGenderSelect('girl')}
                className="relative transform transition-all duration-300 hover:scale-105 focus:outline-none"
              >
                {/* Selection Halo */}
                <AnimatePresence>
                  {selectedGender === 'girl' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 rounded-full bg-green-400/20 blur-xl"
                    />
                  )}
                </AnimatePresence>
                
                {/* Checkmark */}
                <AnimatePresence>
                  {selectedGender === 'girl' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 010-1.414l8-8z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Avatar Container */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 p-1 shadow-2xl shadow-pink-500/50 group-hover:shadow-pink-500/70">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src="/avatars/girl_avatar.png"
                      alt="Girl Avatar"
                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
                
                {/* Label */}
                <div className="mt-6 text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-pink-400 drop-shadow-lg">
                    I am a Girl
                  </h3>
                </div>
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-center text-white/70 max-w-md text-sm sm:text-base">
            This helps Koko know how to talk to you in Hebrew! 🌟
          </p>
        </div>
      </main>
    );
  }

  // Show main app if both profile and gender are selected
  if (!showMainApp) {
    return null; // Will show gender selection above
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Visual Aid Modal */}
      <VisualAid />
      
      {/* Phone Call Interface */}
      <div className="relative h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Blurred Background with Avatar */}
        <div className="absolute inset-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-20 blur-xl"
            style={{ backgroundImage: `url(${userProfile.avatar})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
        </div>

        {/* Debug Drawer Toggle */}
        <button
          onClick={() => setShowDebugDrawer(!showDebugDrawer)}
          className="absolute top-4 right-4 z-50 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs">Debug</span>
        </button>

        {/* Debug Drawer */}
        <AnimatePresence>
          {showDebugDrawer && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="absolute top-0 right-0 h-full w-80 bg-slate-800/95 backdrop-blur-md z-40 p-4 overflow-y-auto"
            >
              <div className="text-white space-y-4">
                <h3 className="text-lg font-bold">Debug Info</h3>
                <div className="text-sm space-y-2">
                  <p>State: {state}</p>
                  <p>Audio Level: {audioLevel.toFixed(0)}%</p>
                  <p>Timer: {formatTimer(callTimer)}</p>
                  <StarCounter />
                </div>
                <button
                  onClick={() => setShowDebugDrawer(false)}
                  className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Call Interface */}
        <div className="relative h-full flex flex-col">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 text-center">
            <div className="text-white/80 text-sm font-medium">
              {state === 'connecting' ? 'Connecting...' : state === 'error' ? 'Connection Error' : formatTimer(callTimer)}
            </div>
          </div>

          {/* Central Avatar */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="relative">
              {/* Voice Ripple Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="absolute rounded-full border-2 border-blue-400/30"
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  style={{
                    width: `${200 + audioLevel * 2}px`,
                    height: `${200 + audioLevel * 2}px`,
                  }}
                />
                <motion.div
                  className="absolute rounded-full border-2 border-blue-400/50"
                  animate={{
                    scale: [1, 1.3, 1.6],
                    opacity: [0.7, 0.3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5
                  }}
                  style={{
                    width: `${200 + audioLevel * 1.5}px`,
                    height: `${200 + audioLevel * 1.5}px`,
                  }}
                />
              </div>

              {/* Avatar */}
              <motion.div
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-white rounded-full flex items-center justify-center shadow-2xl"
                animate={{
                  scale: state === 'speaking' ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: state === 'speaking' ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <img
                  src={userProfile.avatar}
                  alt="Koko"
                  className="w-full h-full rounded-full object-contain"
                />
              </motion.div>

              {/* Voice Wave Indicator */}
              {state === 'speaking' && (
                <motion.div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
            <div className="flex justify-center items-center gap-8">
              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                ) : (
                  <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={disconnect}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-105"
              >
                <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </button>

              {/* Speaker Button */}
              <button
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition-all"
              >
                <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            </div>

            {/* Connection Status */}
            <div className="text-center mt-4">
              <div className={`text-sm font-medium ${
                state === 'connecting' ? 'text-yellow-400' :
                state === 'error' ? 'text-red-400' :
                state === 'listening' ? 'text-green-400' :
                state === 'speaking' ? 'text-blue-400' :
                'text-gray-400'
              }`}>
                {state === 'connecting' ? 'Connecting...' :
                 state === 'error' ? 'Connection Error' :
                 state === 'listening' ? 'Koko is listening' :
                 state === 'speaking' ? 'Koko is speaking' :
                 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
