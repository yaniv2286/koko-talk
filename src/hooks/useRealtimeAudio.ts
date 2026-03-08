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
      console.log('🎤 Initializing audio...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000, // OpenAI Realtime API preferred sample rate
        },
      });

      console.log('✅ Microphone access granted');
      console.log('🎤 Stream active:', stream.active);

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      console.log('🎵 Audio context created:', audioContextRef.current.state);
      console.log('🎵 Analyser created:', !!analyserRef.current);

      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Connect source directly to analyser for level monitoring
      source.connect(analyserRef.current);
      console.log('🎵 Audio source connected to analyser');

      // IMPORTANT: Connect analyser to destination to ensure audio flow
      analyserRef.current.connect(audioContextRef.current.destination);
      console.log('🎵 Analyser connected to destination');

      // Create a simple processor for real-time audio capture
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
              format: 'pcm16'
            }));
          } catch (error) {
            console.error('Error sending audio data:', error);
          }
          
          isRecording = false;
        }
      };
      
      // Connect processor to destination for audio processing
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      console.log('🎵 Audio processor connected for audio capture');

      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio';
      console.error('❌ Audio initialization failed:', errorMessage);
      setConnectionError(errorMessage);
      onError?.(errorMessage);
      throw error;
    }
  }, [setConnectionError, onError, state]);

  // Monitor audio levels
  const monitorAudioLevel = useCallback(() => {
    console.log('🎵 Monitoring audio level...');
    console.log('Analyser exists:', !!analyserRef.current);
    console.log('Current state:', state);
    
    if (!analyserRef.current) {
      console.log('❌ No analyser reference');
      return;
    }

    try {
      // Use time-domain data for voice level detection (better for voice)
      const dataArray = new Uint8Array(analyserRef.current.fftSize);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) for voice levels
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedLevel = Math.min(100, rms * 200); // Scale to 0-100
      
      console.log('🎵 Audio level:', normalizedLevel.toFixed(2));
      console.log('🎵 RMS value:', rms.toFixed(4));
      
      setAudioLevel(normalizedLevel);
      onAudioLevelChange?.(normalizedLevel);

      if (state === 'listening') {
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      } else {
        console.log('🔇 Stopping audio monitoring, state:', state);
      }
    } catch (error) {
      console.error('❌ Error in audio level monitoring:', error);
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

      const { apiKey, model, instructions } = await response.json();

      console.log('🔑 API key received:', apiKey.substring(0, 10) + '...');
      console.log('🔑 API key length:', apiKey.length);
      console.log('🔑 Model:', model);

      // Create WebSocket connection to OpenAI Realtime API
      // Use the official OpenAI Realtime API subprotocol format
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        ['realtime', `openai-insecure-api-key.${apiKey}`]
      );

      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected successfully');
        console.log('🔌 WebSocket readyState:', ws.readyState);
        console.log('🔌 WebSocket URL:', ws.url);
        setState('idle');
        setConnected(true);
        setSessionId(apiKey);
        
        // Send session configuration
        const sessionConfig = {
          type: 'session.update',
          session: {
            type: 'realtime',
            instructions: instructions,
          }
        };
        
        console.log('🔌 Sending session configuration:', sessionConfig);
        console.log('🔌 Session config stringified:', JSON.stringify(sessionConfig));
        
        try {
          ws.send(JSON.stringify(sessionConfig));
          console.log('🔌 Session configuration sent successfully');
        } catch (error) {
          console.error('🔌 Failed to send session configuration:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        setState('error');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('=== OpenAI Message Received ===');
          console.log('Type:', data.type);
          console.log('Full Data:', JSON.stringify(data, null, 2));
          console.log('==============================');
          
          // Handle different message types from OpenAI
          switch (data.type) {
            case 'session.updated':
              // Session successfully updated
              console.log('✅ Session updated successfully:', data.session);
              break;
              
            case 'session.created':
              // Session successfully created (alternative event)
              console.log('✅ Session created successfully:', data.session);
              break;
              
            case 'response.text.done':
              // AI finished speaking
              console.log('✅ AI response:', data.text);
              addConversationMessage('assistant', data.text);
              setState('idle');
              break;
              
            case 'response.started':
              // AI started speaking
              console.log('✅ AI started speaking');
              setState('speaking');
              break;
              
            case 'response.done':
              // AI finished speaking (alternative event)
              console.log('✅ AI response done');
              setState('idle');
              break;
              
            case 'response.audio.delta':
              // Audio chunk for playback
              console.log('🎵 Audio delta received');
              // TODO: Implement audio playback
              break;
              
            case 'input_audio_buffer.speech_started':
              // User started speaking
              console.log('🎤 User started speaking');
              setState('listening');
              monitorAudioLevel();
              break;
              
            case 'input_audio_buffer.speech_stopped':
              // User stopped speaking
              console.log('🔇 User stopped speaking');
              setState('thinking');
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
              }
              break;
              
            case 'error':
              console.error('❌ OpenAI error:', data);
              const errorMessage = data.error?.message || data.error || 'Unknown OpenAI error';
              console.error('❌ Parsed error message:', errorMessage);
              setConnectionError(errorMessage);
              setState('error');
              break;
              
            default:
              console.log('❓ Unhandled message type:', data.type, data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error, event.data);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:');
        console.log('🔌 Close code:', event.code);
        console.log('🔌 Close reason:', event.reason);
        console.log('🔌 Was clean:', event.wasClean);
        setConnected(false);
        setState('idle');
        if (state !== 'idle') {
          const closeReason = event.reason || 'Connection closed unexpectedly';
          console.log('🔌 WebSocket closed unexpectedly:', closeReason);
          setConnectionError(closeReason);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
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
    // Start audio level monitoring immediately
    monitorAudioLevel();
  }, [setState, monitorAudioLevel]);

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
      animationFrameRef.current = null;
    }
    
    // Only close AudioContext if it exists and is not already closed
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('AudioContext already closed or closing:', error);
      }
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
