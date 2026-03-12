'use client';

import { useState } from 'react';
import { useVoiceStore } from '@/store/voiceStore';
import { Send } from 'lucide-react';

export default function SimpleGeminiApp() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [error, setError] = useState('');
  
  const { incrementStarCount, setVisualAid } = useVoiceStore();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    // Add user message
    setConversation(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      // Get response from Gemini
      const response = await fetch('/api/gemini-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: 'Simple User',
          kidGender: 'boy', // Default to boy for simplicity
          message: message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Simulate star award for positive responses
      if (data.response.includes('כל כך שמח') || data.response.includes('מצוין')) {
        incrementStarCount();
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setConversation(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  const handleInitialGreeting = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/gemini-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: 'Simple User',
          kidGender: 'boy'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get greeting');
      }

      const data = await response.json();
      setConversation([{ role: 'assistant', content: data.response }]);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get greeting');
      setConversation([{ role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Please check API key configuration'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get initial greeting on mount
  useState(() => {
    handleInitialGreeting();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <h1 className="text-2xl font-bold text-purple-800 mb-2">קוקו (Koko) - Simple Version</h1>
          <p className="text-gray-600">Cost-effective AI tutor - No connection required</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-96 overflow-y-auto">
          <div className="space-y-3">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.content.startsWith('Error:')
                      ? 'bg-red-100 text-red-800'
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

        {/* Input */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Type your message in Hebrew or English..."
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
          
          <div className="mt-3 text-xs text-gray-500">
            💡 <strong>Tips:</strong> Try "שלום" (Hello) or "מה שמך?" (What's your name?)
          </div>
        </div>
      </div>
    </div>
  );
}
