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

      // Create a simple processor for real-time audio capture
      // Note: ScriptProcessor is deprecated but still widely supported
      // For production, you'd want to use AudioWorklet
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      let isRecording = false;
      
      processor.onaudioprocess = (event) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN && state === 'listening' && !isRecording) {
          isRecording = true;
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputBuffer.length);
          
          // Convert float32 to int16 PCM
          for (let i = 0; i < inputBuffer.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
          }
          
          // Send as base64 encoded audio data
          try {
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            
            websocketRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }));
          } catch (error) {
            console.error('Error sending audio data:', error);
          }
          
          isRecording = false;
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio';
      setConnectionError(errorMessage);
      onError?.(errorMessage);
      throw error;
    }
  }, [setConnectionError, onError, state]);

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

      // Get API key and configuration from our API
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to get API configuration');
      }

      const { apiKey, model, instructions, voice } = await response.json();

      // Create WebSocket connection to OpenAI Realtime API
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        ['realtime', `openai-api-key.${apiKey}`]
      );

      websocketRef.current = ws;

      ws.onopen = () => {
        setState('idle');
        setConnected(true);
        setSessionId(apiKey);
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.create',
          session: {
            instructions: instructions,
            voice: voice,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
          }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle different message types from OpenAI
        switch (data.type) {
          case 'session.created':
            // Session successfully created
            console.log('Session created:', data.session);
            break;
            
          case 'response.text.done':
            // AI finished speaking
            addConversationMessage('assistant', data.text);
            setState('idle');
            break;
            
          case 'response.started':
            // AI started speaking
            setState('speaking');
            break;
            
          case 'response.done':
            // AI finished speaking (alternative event)
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
            
          default:
            console.log('Unhandled message type:', data.type, data);
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
    // Audio capture is now handled automatically by the Web Audio API processor
    setState('listening');
  }, [setState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    // Audio capture stops automatically when state changes from 'listening'
    setState('thinking');
    
    // Trigger response generation
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  }, [setState]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
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
