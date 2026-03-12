'use client';

import { useState } from 'react';
import { useGeminiAudio } from '@/hooks/useGeminiAudio';
import { useVoiceStore } from '@/store/voiceStore';
import { Mic, MicOff, Send } from 'lucide-react';

export default function GeminiKokoApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const { sendMessage, isConnected, connect, disconnect } = useGeminiAudio();
  const { conversationHistory, state, starCount, visualAid } = useVoiceStore();

  const handleStartRecording = async () => {
    if (!isConnected) {
      await connect();
    }
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      await sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">קוקו (Koko) - Gemini Version</h1>
              <p className="text-purple-600">Cost-effective AI Tutor</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-purple-600">⭐ Stars: {starCount}</span>
              </div>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  isConnected ? 'bg-green-100 text-green-800' :
                  state === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  state === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {state}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Aid */}
        {visualAid && visualAid.isVisible && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-purple-800 mb-2">Word: {visualAid.word}</h3>
              <div className="text-4xl mb-2">🔤</div>
              <p className="text-purple-600">Spelling: {visualAid.word.split('').join(' - ')}</p>
              <button
                onClick={() => useVoiceStore.getState().setVisualAid({ 
                  word: visualAid.word, 
                  imageQuery: visualAid.imageQuery || '', 
                  imageUrl: visualAid.imageUrl || '', 
                  isVisible: false 
                })}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Conversation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 h-96 overflow-y-auto">
          <div className="space-y-4">
            {conversationHistory.map((msg: any, index: number) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex gap-4">
            {/* Text Input */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!isConnected}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!isConnected || !message.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Microphone Button */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`px-6 py-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600">
            <p>💡 <strong>Gemini Version:</strong> Cost-effective AI tutor using Google's Gemini API</p>
            <p>🎯 <strong>Cost:</strong> ~90% cheaper than OpenAI Realtime API</p>
            <p>🔊 <strong>Audio:</strong> Text-based for now (TTS coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
