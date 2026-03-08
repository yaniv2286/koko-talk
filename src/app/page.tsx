import { VoiceDebugComponent } from '@/components/VoiceDebugComponent';
import DebugDashboard from '@/components/DebugDashboard';
import SystemDebugger from '@/components/SystemDebugger';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Koko Talk - Phase 1 Debug</h1>
        <VoiceDebugComponent />
      </div>
      <DebugDashboard />
      <SystemDebugger />
    </main>
  );
}
