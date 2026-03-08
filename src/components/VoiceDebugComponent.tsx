'use client';

import { useVoiceStore } from '@/store/voiceStore';
import { useRealtimeAudio } from '@/hooks/useRealtimeAudio';

export const VoiceDebugComponent = () => {
  const {
    state,
    isConnected,
    connectionError,
    audioLevel,
    conversationHistory,
  } = useVoiceStore();

  const {
    connect,
    disconnect,
    startRecording,
    stopRecording,
  } = useRealtimeAudio({
    onError: (error) => console.error('Audio error:', error),
  });

  const handleStartSession = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleStopRecording = () => {
    console.log('CLEAN VERSION: handleStopRecording called, state:', state);
    if (state === 'listening') {
      console.log('CLEAN VERSION: About to call stopRecording');
      console.log('CLEAN VERSION: stopRecording function:', stopRecording);
      try {
        stopRecording();
        console.log('CLEAN VERSION: stopRecording called successfully');
      } catch (error) {
        console.log('CLEAN VERSION: Error calling stopRecording:', error);
      }
    } else {
      console.log('CLEAN VERSION: Not in listening state, current state:', state);
    }
  };

  const handleStopSession = () => {
    disconnect();
  };

  const getStateColor = () => {
    switch (state) {
      case 'idle': return 'bg-gray-500';
      case 'connecting': return 'bg-yellow-500';
      case 'listening': return 'bg-green-500';
      case 'thinking': return 'bg-blue-500';
      case 'speaking': return 'bg-purple-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Koko Talk - Voice Debug Interface</h1>
      
      {/* Connection Controls */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Connection Controls</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleStartSession}
            disabled={isConnected || state === 'connecting'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors"
          >
            Start Session
          </button>
          <button
            onClick={handleStopSession}
            disabled={!isConnected}
            className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-700 transition-colors"
          >
            Stop Session
          </button>
        </div>
        
        {/* Recording Controls */}
        <div className="flex gap-4">
          <button
            onClick={startRecording}
            disabled={!isConnected || state === 'listening' || state === 'thinking'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
          >
            Start Recording
          </button>
          <button
            onClick={handleStopRecording}
            disabled={state !== 'listening'}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-orange-700 transition-colors"
          >
            Stop Recording
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">State:</span>
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getStateColor()}`}>
              {state.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Connection:</span>
            <span className={`px-3 py-1 rounded-full text-white text-sm ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          {connectionError && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Error:</span>
              <span className="text-red-600">{connectionError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Level */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Audio Level</h2>
        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-100 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${audioLevel}%` }}
          >
            {Math.round(audioLevel)}%
          </div>
        </div>
      </div>

      {/* Conversation History */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Conversation History</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {conversationHistory.length === 0 ? (
            <p className="text-gray-500">No conversation yet...</p>
          ) : (
            conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  message.role === 'user' 
                    ? 'bg-blue-100 ml-8' 
                    : 'bg-green-100 mr-8'
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {message.role === 'user' ? 'You' : 'Koko'}
                </div>
                <div>{message.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
