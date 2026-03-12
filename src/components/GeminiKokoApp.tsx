'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeminiAudio } from '@/hooks/useGeminiAudio';
import { useVoiceStore } from '@/store/voiceStore';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

export default function GeminiKokoApp() {
  const [isMuted, setIsMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  
  const { initialize, startRecording, stopRecording, disconnect, isConnected, isRecording } = useGeminiAudio();
  const { userProfile, kidGender, state, audioLevel, starCount, incrementStarCount, setVisualAid, visualAid } = useVoiceStore();

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && state === 'listening') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, state]);

  // Initialize connection on mount
  useEffect(() => {
    if (userProfile && kidGender && !isConnected) {
      initialize();
    }
  }, [initialize, isConnected, userProfile, kidGender]);

  const handleStartCall = async () => {
    console.log('📞 Starting Gemini Live call...');
    if (!isConnected) {
      await initialize();
    }
    await startRecording();
  };

  const handleEndCall = () => {
    console.log('🛑 Ending Gemini Live call...');
    stopRecording();
    disconnect();
    setCallTimer(0);
  };

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading state if profile not set
  if (!userProfile || !kidGender) {
    return (
      <main className="flex flex-col items-center justify-center p-8 font-sans min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Loading Koko...</h1>
          <p className="text-gray-300">Please complete your profile first</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative overflow-hidden min-h-screen">
      {/* Visual Aid Modal - Always mounted */}
      {visualAid && visualAid.isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-800 mb-4">Word: {visualAid.word}</h3>
              <div className="text-6xl mb-4">🔤</div>
              <p className="text-lg text-purple-600 mb-6">Spelling: {visualAid.word.split('').join(' - ')}</p>
              <button
                onClick={() => setVisualAid({ 
                  word: visualAid.word, 
                  imageQuery: visualAid.imageQuery || '', 
                  imageUrl: visualAid.imageUrl || '', 
                  isVisible: false 
                })}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      
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

        {/* Premium Star Counter - Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-2 border border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-xl">⭐</span>
              <span className="text-white font-bold">{starCount}</span>
            </div>
          </div>
        </div>

        {/* Main Call Interface */}
        <div className="relative h-full flex flex-col">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 text-center">
            <div className="text-white/80 text-sm font-medium">
              {state === 'connecting' ? 'Connecting to Koko...' : 
               state === 'error' ? 'Connection Error' : 
               state === 'thinking' ? 'Koko is thinking...' :
               state === 'listening' ? 'Koko is listening' :
               state === 'speaking' ? 'Koko is speaking' :
               formatTimer(callTimer)}
            </div>
          </div>

          {/* Central Avatar */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="relative">
              {/* Voice Ripple Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                {(state === 'listening' || state === 'speaking') && (
                  <>
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
                        width: `${200 + (audioLevel || 0) * 2}px`,
                        height: `${200 + (audioLevel || 0) * 2}px`,
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
                        width: `${200 + (audioLevel || 0) * 1.5}px`,
                        height: `${200 + (audioLevel || 0) * 1.5}px`,
                      }}
                    />
                  </>
                )}
              </div>

              {/* Avatar */}
              <motion.div
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
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
                  src={userProfile?.avatar || '/avatars/boy_avatar.png'}
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
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
                </motion.div>
              )}

              {/* Microphone Indicator when listening */}
              {state === 'listening' && (
                <motion.div
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg shadow-red-400/50" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
            {/* Start Call Button - Only show when not connected */}
            {!isConnected && state === 'idle' && (
              <div className="flex justify-center items-center">
                <button
                  onClick={handleStartCall}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/50 border-2 border-green-600"
                >
                  <Phone className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </button>
              </div>
            )}

            {/* Call Controls - Show when connected */}
            {isConnected && (
              <div className="flex justify-center items-center gap-8">
                {/* Mute Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all border border-white/20 ${
                    isMuted ? 'bg-red-500/20 border-red-500' : 'hover:bg-white/20'
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
                  onClick={handleEndCall}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-105 shadow-lg hover:shadow-red-500/50 border-2 border-red-600"
                >
                  <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </button>

                {/* Speaker Button */}
                <button
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all border border-white/20 hover:bg-white/20"
                >
                  <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
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
                state === 'thinking' ? 'text-purple-400' :
                'text-white/60'
              }`}>
                {state === 'connecting' ? 'Connecting to Koko...' :
                 state === 'error' ? 'Connection Error - Try Again' :
                 state === 'listening' ? '🎤 Koko is listening to you' :
                 state === 'speaking' ? '🔊 Koko is speaking' :
                 state === 'thinking' ? '🤔 Koko is thinking...' :
                 isConnected ? '📞 Connected to Koko' :
                 '📱 Ready to start call'}
              </div>
            </div>

            {/* Gemini Live API Badge */}
            <div className="text-center mt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/80">Gemini Live API</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
