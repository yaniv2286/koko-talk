'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/Avatar';
import { Controls } from '@/components/Controls';
import { ProfileSelector } from '@/components/ProfileSelector';
import { StarCounter } from '@/components/StarCounter';
import { VisualAid } from '@/components/VisualAid';
import { useVoiceStore } from '@/store/voiceStore';
import { useRealtimeAudio } from '@/hooks/useRealtimeAudio';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

export default function Home() {
  console.log('🏠 Home component rendering');
  const { userProfile, kidGender, setKidGender, setProfile, state, audioLevel, disconnect } = useVoiceStore();
  console.log('🏠 Store state (real-time):', { 
    userProfile: userProfile?.name, 
    kidGender, 
    state,
    showMainApp: false // Will check this next
  });
  const { connect, disconnect: rtcDisconnect } = useRealtimeAudio({});
  const [showMainApp, setShowMainApp] = useState(false);
  console.log('🏠 Local state:', { showMainApp });
  const [isMuted, setIsMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [showDebugDrawer, setShowDebugDrawer] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl' | null>(null);

  const hardcodedAvatars = [
    '/avatars/boy_avatar.png',
    '/avatars/girl_avatar.png',
    '/avatars/cute-dog-studio.jpg',
    '/avatars/Gemini_Generated_Image_sndvtosndvtosndv.png',
    '/avatars/Gemini_Generated_Image_4xj7d14xj7d14xj7.png'
  ];

  const handleGenderSelected = () => {
    console.log('🏠 handleGenderSelected called, showing avatar selection');
    // Create a default profile and show avatar selection
    const defaultProfile = {
      id: `default-${selectedGender}`,
      name: selectedGender === 'boy' ? 'Boy' : 'Girl',
      ageGroup: '8-12' as const,
      avatar: selectedGender === 'boy' ? '/avatars/boy_avatar.png' : '/avatars/girl_avatar.png',
    };
    setProfile(defaultProfile);
  };

  const handleProfileSelected = () => {
    console.log('🏠 handleProfileSelected called - setting showMainApp to true');
    setShowMainApp(true);
  };

  const handleGenderSelect = (gender: 'boy' | 'girl') => {
    console.log('🚀 Selection made:', gender);
    console.log('🏠 Before setKidGender - kidGender:', kidGender);
    setSelectedGender(gender);
    setKidGender(gender);
    console.log('🏠 After setKidGender - calling handleGenderSelected');
    setTimeout(() => {
      console.log('🏠 Timeout - calling handleGenderSelected');
      handleGenderSelected();
    }, 300); // Brief delay to show selection animation
  };

  const handleStartCall = () => {
    console.log('📞 Attempting to connect...');
    connect();
  };

  const handleEndCall = () => {
    console.log('📞 Ending call...');
    rtcDisconnect();
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

  // Show Gender Selection as the first page (mandatory onboarding)
  if (!kidGender) {
    console.log('🏠 Showing Gender Selection (first page)');
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
              Koko
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 font-medium drop-shadow">
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
                
                {/* Avatar Container with Blue Glowing Border */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border-[3px] border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)] overflow-hidden">
                  <img
                    src="/avatars/boy_avatar.png"
                    alt="Boy Avatar"
                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                {/* Label */}
                <div className="mt-6 text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-blue-400">
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
                
                {/* Avatar Container with Pink Glowing Border */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border-[3px] border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] overflow-hidden">
                  <img
                    src="/avatars/girl_avatar.png"
                    alt="Girl Avatar"
                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                {/* Label */}
                <div className="mt-6 text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-pink-400">
                    I am a Girl
                  </h3>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              This helps Koko know how to talk to you in Hebrew! 🌟
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Show ProfileSelector if gender is selected but no profile
  if (!userProfile) {
    console.log('🏠 Showing ProfileSelector (avatar selection)');
    return <ProfileSelector onProfileSelected={handleProfileSelected} />;
  }

  // Show main app if both profile and gender are selected
  if (!showMainApp) {
    console.log('🏠 showMainApp is false, returning null');
    return null; // Will show gender selection above
  }

  console.log('🏠 Showing Main App');
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Visual Aid Modal */}
      <VisualAid />
      
      {/* Phone Call Interface */}
      <div className="relative h-screen">
        {/* Blurred Background with Avatar */}
        <div className="absolute inset-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-20 blur-xl"
            style={{ backgroundImage: `url(${userProfile?.avatar})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D021A]/80 to-[#0D021A]" />
        </div>

        {/* Debug Drawer Toggle */}
        <button
          onClick={() => setShowDebugDrawer(!showDebugDrawer)}
          className="absolute top-4 right-4 z-50 p-2 glass-dark rounded-full text-primary hover:bg-white/20 transition-colors"
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
              className="absolute top-0 right-0 h-full w-80 glass-dark z-40 p-4 overflow-y-auto"
            >
              <div className="text-primary space-y-4">
                <h3 className="text-lg font-bold">Debug Info</h3>
                <div className="text-sm space-y-2">
                  <p>State: {state}</p>
                  <p>Audio Level: {audioLevel.toFixed(0)}%</p>
                  <p>Timer: {formatTimer(callTimer)}</p>
                  <StarCounter />
                </div>
                <button
                  onClick={() => setShowDebugDrawer(false)}
                  className="w-full py-2 bg-red-500 text-primary rounded-lg hover:bg-red-600 transition-colors"
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
            <div className="text-secondary text-sm font-medium">
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
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 glass-dark rounded-full flex items-center justify-center"
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
                  src={userProfile?.avatar || '/koko.png'}
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
                  <div className="w-2 h-2 bg-green-400 rounded-full neon-green" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
            {/* Start Call Button - Show when not connected */}
            {state === 'idle' && (
              <div className="flex justify-center items-center">
                <button
                  onClick={handleStartCall}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full btn-glass flex items-center justify-center transition-all transform hover:scale-105 neon-green"
                >
                  <Phone className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                </button>
              </div>
            )}

            {/* Call Controls - Show when connected */}
            {state !== 'idle' && (
              <div className="flex justify-center items-center gap-8">
                {/* Mute Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full btn-glass flex items-center justify-center transition-all ${
                    isMuted ? 'neon-red' : ''
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  ) : (
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  )}
                </button>

                {/* End Call Button */}
                <button
                  onClick={handleEndCall}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full btn-glass flex items-center justify-center transition-all transform hover:scale-105 neon-red"
                >
                  <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </button>

                {/* Speaker Button */}
                <button
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full btn-glass flex items-center justify-center transition-all"
                >
                  <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </button>
              </div>
            )}

            {/* Connection Status */}
            <div className="text-center mt-4">
              <div className={`text-sm font-medium ${
                state === 'connecting' ? 'text-yellow-400' :
                state === 'error' ? 'text-red-400' :
                state === 'listening' ? 'text-green-400' :
                state === 'speaking' ? 'text-blue-400' :
                'text-secondary'
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
