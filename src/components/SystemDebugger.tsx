'use client';

import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'log' | 'error' | 'warn' | 'info';
}

export const SystemDebugger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCapturing) return;

    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // Override console methods to capture logs
    const captureLog = (level: LogEntry['type'], ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.join(' ');
      
      setLogs(prev => {
        const newLog = { timestamp, message, type: level };
        // Keep only the last 100 logs
        const updatedLogs = [...prev, newLog].slice(-100);
        return updatedLogs;
      });

      // Call original console method
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

    // Auto-scroll to bottom when new logs arrive
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }

    return () => {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [isCapturing]);

  const clearLogs = () => setLogs([]);

  const exportLogs = () => {
    const logsText = logs.map(log => 
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

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-black/95 text-white p-4 rounded-lg shadow-xl z-50 font-mono text-xs max-h-96 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-green-400">🔍 Simple Log Window</h3>
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

      <div 
        ref={logContainerRef}
        className="space-y-1 overflow-y-auto max-h-72"
      >
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            {isCapturing ? 'Capturing logs...' : 'Click ▶ to start capturing'}
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              className={`${log.type === 'error' ? 'text-red-400' : 
                        log.type === 'warn' ? 'text-yellow-400' : 
                        log.type === 'info' ? 'text-blue-400' : 
                        'text-gray-300'} 
                        text-xs leading-tight`}
            >
              <span className="text-gray-500 mr-2">{log.timestamp}</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
