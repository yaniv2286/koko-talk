'use client';

import React, { useState, useEffect } from 'react';

interface SystemDebugData {
  timestamp: string;
  type: 'websocket' | 'audio' | 'api' | 'error' | 'state';
  message: string;
  data: any;
}

export default function SystemDebugger() {
  const [debugLogs, setDebugLogs] = useState<SystemDebugData[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);

  useEffect(() => {
    if (!isCapturing) return;

    // Intercept all console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const captureLog = (level: 'log' | 'error' | 'warn' | 'info', ...args: any[]) => {
      const message = args.join(' ');
      const timestamp = new Date().toISOString();
      
      // Categorize and capture important events
      let logType: SystemDebugData['type'] = 'error';
      
      if (message.includes('🔌') || message.includes('WebSocket')) {
        logType = 'websocket';
      } else if (message.includes('🎵') || message.includes('Audio')) {
        logType = 'audio';
      } else if (message.includes('🔑') || message.includes('API')) {
        logType = 'api';
      } else if (message.includes('❌')) {
        logType = 'error';
      } else if (message.includes('State:') || message.includes('listening') || message.includes('thinking')) {
        logType = 'state';
      }

      // Always capture API key related logs
      if (message.includes('API key') || message.includes('sk-proj') || message.includes('EXISTS') || message.includes('NULL')) {
        logType = 'api';
      }

      // Only capture important events
      if (logType !== 'error' || message.includes('❌')) {
        setDebugLogs(prev => [...prev.slice(-100), {
          timestamp,
          type: logType,
          message,
          data: args
        }]);
      }

      // Call original method
      if (level === 'log') originalLog(...args);
      else if (level === 'error') originalError(...args);
      else if (level === 'warn') originalWarn(...args);
      else if (level === 'info') originalInfo(...args);
    };

    // Override console methods
    console.log = (...args) => captureLog('log', ...args);
    console.error = (...args) => captureLog('error', ...args);
    console.warn = (...args) => captureLog('warn', ...args);
    console.info = (...args) => captureLog('info', ...args);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [isCapturing]);

  const clearLogs = () => setDebugLogs([]);

  const exportLogs = () => {
    const logsText = debugLogs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koko-debug-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-detect issues
  const detectIssues = () => {
    const issues = [];
    
    // Check for WebSocket connection issues
    const websocketLogs = debugLogs.filter(log => log.type === 'websocket');
    const hasConnection = websocketLogs.some(log => log.message.includes('connected successfully'));
    const hasAuthError = websocketLogs.some(log => log.message.includes('Missing bearer'));
    
    if (!hasConnection && websocketLogs.length > 0) {
      issues.push('❌ WebSocket not connecting');
    }
    
    if (hasAuthError) {
      issues.push('❌ Authentication error detected');
    }
    
    // Check for audio issues
    const audioLogs = debugLogs.filter(log => log.type === 'audio');
    const hasAudioLevels = audioLogs.some(log => log.message.includes('Audio level:'));
    
    if (!hasAudioLevels && audioLogs.length > 0) {
      issues.push('❌ No audio levels detected');
    }
    
    // Check for API key issues
    const apiLogs = debugLogs.filter(log => log.type === 'api');
    const hasApiKey = apiLogs.some(log => log.message.includes('API key received:') && log.message.includes('sk-proj'));
    const hasApiKeyExists = apiLogs.some(log => log.message.includes('EXISTS'));
    const hasApiKeyTest = apiLogs.some(log => log.message.includes('API key validation passed'));
    const hasFrontendApiKey = apiLogs.some(log => log.message.includes('API key received: YES'));
    
    if (!hasApiKey && !hasApiKeyExists && !hasApiKeyTest && !hasFrontendApiKey) {
      issues.push('❌ No API key detected from server');
    }

    return issues;
  };

  const issues = detectIssues();

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-black/95 text-white p-4 rounded-lg shadow-xl z-50 font-mono text-xs max-h-96 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-green-400">🔍 System Debugger</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCapturing(!isCapturing)}
            className={`${isCapturing ? 'bg-red-600' : 'bg-green-600'} hover:opacity-80 px-2 py-1 rounded text-xs`}
          >
            {isCapturing ? '⏸' : '▶'}
          </button>
          <button 
            onClick={clearLogs}
            className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
          <button 
            onClick={exportLogs}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Export
          </button>
        </div>
      </div>

      {/* Auto-detected Issues */}
      {issues.length > 0 && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded">
          <div className="font-bold text-red-400 mb-1">🚨 Issues Detected:</div>
          {issues.map((issue, i) => (
            <div key={i} className="text-xs text-red-300">{issue}</div>
          ))}
        </div>
      )}

      {/* Status Summary */}
      <div className="mb-3 grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-800 p-1 rounded">
          <div className="text-gray-400">WS</div>
          <div className={debugLogs.some(l => l.type === 'websocket' && l.message.includes('connected')) ? 'text-green-400' : 'text-red-400'}>
            {debugLogs.some(l => l.type === 'websocket' && l.message.includes('connected')) ? '✅' : '❌'}
          </div>
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <div className="text-gray-400">Audio</div>
          <div className={debugLogs.some(l => l.type === 'audio' && l.message.includes('Audio level:')) ? 'text-green-400' : 'text-red-400'}>
            {debugLogs.some(l => l.type === 'audio' && l.message.includes('Audio level:')) ? '✅' : '❌'}
          </div>
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <div className="text-gray-400">API</div>
          <div className={debugLogs.some(l => l.type === 'api' && l.message.includes('API key')) ? 'text-green-400' : 'text-red-400'}>
            {debugLogs.some(l => l.type === 'api' && l.message.includes('API key')) ? '✅' : '❌'}
          </div>
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <div className="text-gray-400">Errors</div>
          <div className={issues.length === 0 ? 'text-green-400' : 'text-red-400'}>
            {issues.length === 0 ? '✅' : issues.length}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {debugLogs.slice(-20).reverse().map((log, i) => (
          <div key={i} className={`text-xs border-l-2 pl-2 ${
            log.type === 'websocket' ? 'border-blue-500' :
            log.type === 'audio' ? 'border-green-500' :
            log.type === 'api' ? 'border-yellow-500' :
            log.type === 'error' ? 'border-red-500' :
            'border-gray-500'
          }`}>
            <div className="flex justify-between">
              <span className="text-gray-400">{log.timestamp.slice(11, 19)}</span>
              <span className={`font-bold ${
                log.type === 'websocket' ? 'text-blue-400' :
                log.type === 'audio' ? 'text-green-400' :
                log.type === 'api' ? 'text-yellow-400' :
                log.type === 'error' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {log.type.toUpperCase()}
              </span>
            </div>
            <div className="truncate">{log.message.substring(0, 80)}...</div>
          </div>
        ))}
      </div>
    </div>
  );
}
