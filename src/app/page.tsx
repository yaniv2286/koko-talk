'use client';

import dynamic from 'next/dynamic';

// Bulletproof Next.js SSR bypass for Gemini Live API and Zustand
const KokoApp = dynamic(() => import('../components/KokoApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-[#290c54] via-[#1a053a] to-[#0b0118] flex items-center justify-center">
      <div className="text-white text-2xl font-bold animate-pulse">
        Loading Koko...
      </div>
      <div className="text-white/60 text-sm mt-2">
        Powered by Gemini Live API
      </div>
    </div>
  )
});

export default function Home() {
  return <KokoApp />;
}
