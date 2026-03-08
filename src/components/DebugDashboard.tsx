'use client';

import React, { useState, useEffect } from 'react';

interface AudioDebugData {
  timestamp: string;
  audioLevel: number;
  rmsValue: number;
  state: string;
  analyserExists: boolean;
  audioContextState: string;
  streamActive: boolean;
}

interface WebSocketDebugData {
  timestamp: string;
  type: string;
  data: any;
  direction: 'sent' | 'received';
}

export default function DebugDashboard() {
  const [audioLogs, setAudioLogs] = useState<AudioDebugData[]>([]);
  const [websocketLogs, setWebsocketLogs] = useState<WebSocketDebugData[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Intercept console logs to capture debugging data
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      
      // Parse audio level logs
      const message = args.join(' ');
      if (message.includes('🎵 Audio level:')) {
        const match = message.match(/🎵 Audio level: ([\d.]+)/);
        const rmsMatch = message.match(/🎵 RMS value: ([\d.]+)/);
        const stateMatch = message.match(/Current state: (\w+)/);
        
        if (match) {
          setAudioLogs(prev => [...prev.slice(-50), {
            timestamp: new Date().toLocaleTimeString(),
            audioLevel: parseFloat(match[1]),
            rmsValue: rmsMatch ? parseFloat(rmsMatch[1]) : 0,
            state: stateMatch ? stateMatch[1] : 'unknown',
            analyserExists: message.includes('Analyser exists: true'),
            audioContextState: 'unknown',
            streamActive: message.includes('Stream active: true')
          }]);
        }
      }
      
      // Parse WebSocket logs
      if (message.includes('=== OpenAI Message Received ===') || 
          message.includes('Sending session configuration')) {
        const typeMatch = message.match(/Type: (\w+)/);
        const direction = message.includes('Sending') ? 'sent' : 'received';
        
        if (typeMatch) {
          setWebsocketLogs(prev => [...prev.slice(-50), {
            timestamp: new Date().toLocaleTimeString(),
            type: typeMatch[1],
            data: args,
            direction
          }]);
        }
      }
    };
    
    console.error = (...args) => {
      originalError(...args);
      
      const message = args.join(' ');
      if (message.includes('❌')) {
        setWebsocketLogs(prev => [...prev.slice(-50), {
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          data: args,
          direction: 'received'
        }]);
      }
    };
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const clearLogs = () => {
    setAudioLogs([]);
    setWebsocketLogs([]);
  };

  return (
    <div className="fixed top-4 right-4 w-96 bg-black/90 text-white p-4 rounded-lg shadow-xl z-50 font-mono text-xs">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold">🔍 Debug Dashboard</h3>
        <button 
          onClick={clearLogs}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear
        </button>
      </div>
      
      {/* Audio Level Monitor */}
      <div className="mb-4">
        <h4 className="text-xs font-bold mb-2">🎵 Audio Levels (Last 10)</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {audioLogs.slice(-10).reverse().map((log, i) => (
            <div key={i} className="text-xs border-l-2 border-blue-500 pl-2">
              <div className="flex justify-between">
                <span>{log.timestamp}</span>
                <span className={`font-bold ${
                  log.audioLevel > 20 ? 'text-green-400' : 
                  log.audioLevel > 5 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {log.audioLevel.toFixed(1)}%
                </span>
              </div>
              <div className="text-gray-400">
                RMS: {log.rmsValue.toFixed(4)} | State: {log.state}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* WebSocket Messages */}
      <div className="mb-4">
        <h4 className="text-xs font-bold mb-2">📡 WebSocket (Last 10)</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {websocketLogs.slice(-10).reverse().map((log, i) => (
            <div key={i} className={`text-xs border-l-2 pl-2 ${
              log.type === 'ERROR' ? 'border-red-500' :
              log.direction === 'sent' ? 'border-green-500' : 'border-blue-500'
            }`}>
              <div className="flex justify-between">
                <span>{log.timestamp}</span>
                <span className={`font-bold ${
                  log.type === 'ERROR' ? 'text-red-400' :
                  log.direction === 'sent' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {log.type}
                </span>
              </div>
              <div className="text-gray-400 truncate">
                {log.direction === 'sent' ? '→' : '←'} {JSON.stringify(log.data).substring(0, 50)}...
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Indicators */}
      <div className="border-t border-gray-600 pt-2">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Audio Logs:</span>
            <span className={audioLogs.length > 0 ? 'text-green-400' : 'text-red-400'}>
              {audioLogs.length > 0 ? '🟢 Active' : '🔴 None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>WebSocket:</span>
            <span className={websocketLogs.some(log => log.type === 'session.updated') ? 'text-green-400' : 'text-yellow-400'}>
              {websocketLogs.some(log => log.type === 'session.updated') ? '🟢 Connected' : '🟡 Pending'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Audio Level:</span>
            <span className={
              audioLogs.length > 0 ? 
              (audioLogs[audioLogs.length - 1].audioLevel > 0 ? 'text-green-400' : 'text-red-400')
              : 'text-gray-400'
            }>
              {audioLogs.length > 0 ? `${audioLogs[audioLogs.length - 1].audioLevel.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
