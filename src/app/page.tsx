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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Star Counter */}
      <StarCounter />
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
          Koko Talk
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Your friendly English tutor! 🎓
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
