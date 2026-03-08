import { useEffect, useRef, useCallback } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

interface UseRealtimeAudioOptions {
  onAudioLevelChange?: (level: number) => void;
  onError?: (error: string) => void;
}

export const useRealtimeAudio = ({
  onAudioLevelChange,
  onError,
}: UseRealtimeAudioOptions = {}) => {
  const {
    state,
    setState,
    setConnected,
    setConnectionError,
    setAudioLevel,
    setSessionId,
    addConversationMessage,
  } = useVoiceStore();

  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context and analyser
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000, // OpenAI Realtime API preferred sample rate
        },
      });

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up media recorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio';
      setConnectionError(errorMessage);
      onError?.(errorMessage);
      throw error;
    }
  }, [setConnectionError, onError]);

  // Monitor audio levels
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);
    
    setAudioLevel(normalizedLevel);
    onAudioLevelChange?.(normalizedLevel);

    if (state === 'listening') {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [state, setAudioLevel, onAudioLevelChange]);

  // Start WebSocket connection
  const connect = useCallback(async () => {
    try {
      setState('connecting');
      setConnectionError(null);

      // Get ephemeral token from our API
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to get session token');
      }

      const { client_secret } = await response.json();

      // Create WebSocket connection to OpenAI Realtime API
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01&authorization=${encodeURIComponent(`Bearer ${client_secret.value}`)}`
      );

      websocketRef.current = ws;

      ws.onopen = () => {
        setState('idle');
        setConnected(true);
        setSessionId(client_secret.value);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle different message types from OpenAI
        switch (data.type) {
          case 'response.audio_transcript.done':
            // AI finished speaking
            addConversationMessage('assistant', data.transcript);
            setState('idle');
            break;
            
          case 'response.audio.delta':
            // Audio chunk for playback
            // TODO: Implement audio playback
            break;
            
          case 'input_audio_buffer.speech_started':
            // User started speaking
            setState('listening');
            monitorAudioLevel();
            break;
            
          case 'input_audio_buffer.speech_stopped':
            // User stopped speaking
            setState('thinking');
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            break;
            
          case 'error':
            setConnectionError(data.error.message);
            setState('error');
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setState('idle');
        if (state !== 'idle') {
          setConnectionError('Connection closed unexpectedly');
        }
      };

      ws.onerror = (error) => {
        setConnectionError('WebSocket connection error');
        setState('error');
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  }, [
    setState,
    setConnected,
    setConnectionError,
    setSessionId,
    addConversationMessage,
    onError,
    monitorAudioLevel,
  ]);

  // Start recording and sending audio
  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !websocketRef.current) return;

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
        // Convert audio data and send to OpenAI
        // TODO: Implement proper audio format conversion
        websocketRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: event.data, // This needs proper base64 encoding
        }));
      }
    };

    mediaRecorderRef.current.start(100); // Send chunks every 100ms
    setState('listening');
  }, [setState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState('thinking');
    }
  }, [setState]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setConnected(false);
    setState('idle');
  }, [setConnected, setState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    initializeAudio,
  };
};
