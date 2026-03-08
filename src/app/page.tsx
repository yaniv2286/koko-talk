'use client';

import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Controls } from '@/components/Controls';
import { ProfileSelector } from '@/components/ProfileSelector';
import { StarCounter } from '@/components/StarCounter';
import { VisualAid } from '@/components/VisualAid';
import { useVoiceStore } from '@/store/voiceStore';

export default function Home() {
  const { userProfile, kidGender, setKidGender } = useVoiceStore();
  const [showMainApp, setShowMainApp] = useState(false);

  const handleProfileSelected = () => {
    // Profile selected, will show gender selection next
  };

  const handleGenderSelected = () => {
    setShowMainApp(true);
  };

  // Show ProfileSelector if no profile is selected
  if (!userProfile) {
    return <ProfileSelector onProfileSelected={handleProfileSelected} />;
  }

  // Show Gender Selection if profile is selected but gender is not
  if (!kidGender) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-100 to-purple-100 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 mb-4 tracking-tight">
            Koko
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium">
            One more thing before we start...
          </p>
        </div>

        {/* Gender Selection Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-8">
          {/* Boy Button */}
          <button
            onClick={() => {
              setKidGender('boy');
              handleGenderSelected();
            }}
            className="group relative bg-blue-500 hover:bg-blue-600 text-white rounded-3xl p-8 sm:p-12 transform transition-all duration-200 hover:scale-105 hover:shadow-2xl min-w-[200px] sm:min-w-[250px]"
          >
            <div className="text-6xl sm:text-7xl mb-4">👦</div>
            <div className="text-xl sm:text-2xl font-bold">I am a Boy</div>
            <div className="absolute inset-0 rounded-3xl bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          </button>

          {/* Girl Button */}
          <button
            onClick={() => {
              setKidGender('girl');
              handleGenderSelected();
            }}
            className="group relative bg-pink-500 hover:bg-pink-600 text-white rounded-3xl p-8 sm:p-12 transform transition-all duration-200 hover:scale-105 hover:shadow-2xl min-w-[200px] sm:min-w-[250px]"
          >
            <div className="text-6xl sm:text-7xl mb-4">👧</div>
            <div className="text-xl sm:text-2xl font-bold">I am a Girl</div>
            <div className="absolute inset-0 rounded-3xl bg-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-center text-slate-600 max-w-md">
          This helps Koko know how to talk to you in Hebrew! 🌟
        </p>
      </main>
    );
  }

  // Show main app if both profile and gender are selected
  if (!showMainApp) {
    return null; // Will show gender selection above
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      {/* Visual Aid Modal */}
      <VisualAid />
      
      {/* Star Counter */}
      <StarCounter />
      
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-slate-800 mb-4 tracking-tight">
          Koko
        </h1>
        <p className="text-xl sm:text-2xl text-slate-800 font-light">
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
