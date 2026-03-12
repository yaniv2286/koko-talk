'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      setApiStatus({ error: 'Failed to check API status' });
    }
  };

  const testGeminiApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: 'Test User',
          kidGender: 'boy',
          message: 'Hello from debug page'
        }),
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">KOKO Debug Page</h1>
        
        {/* API Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">API Status</h2>
          {apiStatus ? (
            <div className="space-y-2">
              <div className={`p-3 rounded ${apiStatus.google_ai_key_set ? 'bg-green-100' : 'bg-red-100'}`}>
                <strong>Google AI API Key:</strong> {apiStatus.google_ai_key_set ? '✅ Set' : '❌ Not Set'}
                {apiStatus.google_ai_key_set && (
                  <span className="ml-2 text-sm text-gray-600">
                    (Length: {apiStatus.google_ai_key_length})
                  </span>
                )}
              </div>
              <div className={`p-3 rounded ${apiStatus.openai_key_set ? 'bg-green-100' : 'bg-red-100'}`}>
                <strong>OpenAI API Key:</strong> {apiStatus.openai_key_set ? '✅ Set' : '❌ Not Set'}
                {apiStatus.openai_key_set && (
                  <span className="ml-2 text-sm text-gray-600">
                    (Length: {apiStatus.openai_key_length})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Test API */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Gemini API</h2>
          <button
            onClick={testGeminiApi}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
          
          {testResult && (
            <div className="mt-4">
              {testResult.error ? (
                <div className="p-3 bg-red-100 text-red-800 rounded">
                  <strong>Error:</strong> {testResult.error}
                </div>
              ) : (
                <div className="p-3 bg-green-100 text-green-800 rounded">
                  <strong>✅ Success!</strong>
                  <br />
                  <strong>Response:</strong> {testResult.response?.substring(0, 100)}...
                  <br />
                  <strong>Model:</strong> {testResult.model}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold">If Google AI API Key is not set:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-600 underline">Google AI Studio</a></li>
                <li>Create a new API key</li>
                <li>Add it to your environment variables as <code>GOOGLE_AI_API_KEY</code></li>
                <li>Restart the application</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold">For Vercel Deployment:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to your Vercel project dashboard</li>
                <li>Click on "Settings" → "Environment Variables"</li>
                <li>Add <code>GOOGLE_AI_API_KEY</code> with your API key</li>
                <li>Redeploy the application</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
