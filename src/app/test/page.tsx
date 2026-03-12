'use client';

import { useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

export default function TestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    // Add user message
    setConversation(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      // Test API call
      const response = await fetch('/api/gemini-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: 'Test User',
          kidGender: 'boy',
          message: message
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const error = await response.json();
        setConversation(prev => [...prev, { role: 'assistant', content: `Error: ${error.error}` }]);
      }
    } catch (error) {
      setConversation(prev => [...prev, { role: 'assistant', content: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-purple-800">קוקו (Koko) - Test Page</h1>
          <p className="text-purple-600">Debug Gemini API connection</p>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-purple-800 mb-2">Debug Information</h2>
          <div className="text-sm text-gray-600">
            <p>🔍 Check the console for API errors</p>
            <p>🔑 Make sure GOOGLE_AI_API_KEY is set in .env.local</p>
            <p>📝 Get API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-purple-600 underline">Google AI Studio</a></p>
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 h-96 overflow-y-auto">
          <div className="space-y-4">
            {conversation.map((msg, index) => (
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
