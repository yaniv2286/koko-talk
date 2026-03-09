'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { 
  error: Error & { digest?: string }; 
  reset: () => void 
}) {
  useEffect(() => {
    console.error('🚨 CAUGHT FATAL ERROR:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#290c54] via-[#1a053a] to-[#0b0118] flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-red-400 mb-4">🚨 Fatal Error Detected</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Error Message:</h2>
          <p className="text-secondary font-mono text-sm bg-black/30 p-3 rounded-lg">
            {error.message}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Stack Trace:</h2>
          <pre className="text-secondary font-mono text-xs bg-black/30 p-3 rounded-lg overflow-auto max-h-64">
            {error.stack}
          </pre>
        </div>

        {error.digest && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">Error Digest:</h2>
            <p className="text-secondary font-mono text-sm bg-black/30 p-3 rounded-lg">
              {error.digest}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
          >
            🔄 Reload Page
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>This error has been logged to the console for debugging.</p>
          <p>Please check the browser console for more details.</p>
        </div>
      </div>
    </div>
  );
}
