'use client';

import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Controls } from '@/components/Controls';
import { ProfileSelector } from '@/components/ProfileSelector';
import { StarCounter } from '@/components/StarCounter';
import { useVoiceStore } from '@/store/voiceStore';

export default function Home() {
  const { userProfile } = useVoiceStore();
  const [showMainApp, setShowMainApp] = useState(false);

  const handleProfileSelected = () => {
    setShowMainApp(true);
  };

  // Show ProfileSelector if no profile is selected, otherwise show main app
  if (!userProfile || !showMainApp) {
    return <ProfileSelector onProfileSelected={handleProfileSelected} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      {/* Star Counter */}
      <StarCounter />
      
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-slate-800 mb-4 tracking-tight">
          Koko
        </h1>
        <p className="text-xl sm:text-2xl text-slate-600 font-light">
          Your AI English Tutor
        </p>
      </div>

      {/* Main Content - Avatar and Controls */}
      <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-4xl mx-auto">
        {/* Avatar */}
        <Avatar className="flex-1 flex items-center justify-center" />
        
        {/* Controls */}
        <Controls className="flex-shrink-0" />
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Made with ❤️ for kids learning English
        </p>
      </div>
    </main>
  );
}
