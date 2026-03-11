'use client';

import React from 'react';
import GeminiKokoApp from '@/components/GeminiKokoApp';
import { useVoiceStore } from '@/store/voiceStore';

export default function GeminiPage() {
  const { userProfile, kidGender } = useVoiceStore();

  return (
    <div className="min-h-screen">
      <GeminiKokoApp />
    </div>
  );
}
