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
      console.log('🎤 Starting audio initialization...');
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
      console.log('🎤 Stream tracks:', stream.getAudioTracks().length);
      console.log('🎤 Stream track enabled:', stream.getAudioTracks()[0]?.enabled);

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      console.log('🎵 Audio context created:', audioContextRef.current.state);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
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
      console.log('🎤 Audio initialization completed successfully');

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
    if (!analyserRef.current || state !== 'listening') return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (state !== 'listening') return;
      
      // Get time-domain data for better voice detection
      analyser.getByteTimeDomainData(dataArray);
      
      // Calculate RMS (Root Mean Square) for accurate volume measurement
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalizedValue = (dataArray[i] - 128) / 128; // Convert from 0-255 to -1 to 1
        sum += normalizedValue * normalizedValue;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      
      // Convert RMS to percentage (more sensitive to voice)
      const audioLevel = Math.min(100, rms * 200); // Increased sensitivity
      
      // Update audio level with more responsive changes
      setAudioLevel(audioLevel);
      onAudioLevelChange?.(audioLevel);
      
      // Log values for debugging
      if (Math.random() < 0.3) { // Log 30% of the time to see more changes
        console.log('🎵 Audio level:', audioLevel.toFixed(2) + '%');
        console.log('🎵 RMS value:', rms.toFixed(4));
        console.log('🎵 State:', state);
        console.log('🎵 Raw RMS:', rms);
        console.log('🎵 Calculated level:', (rms * 200).toFixed(2));
      }
      
      // Continue monitoring if still in listening state
      if (state === 'listening') {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    // Start the monitoring loop
    updateLevel();
  }, [state, setAudioLevel, onAudioLevelChange]);

  // Start WebSocket connection
  const connect = useCallback(async () => {
    try {
      setState('connecting');
      setConnectionError(null);

      // Get API key and configuration from our API
      console.log('🔌 Starting API key fetch...');
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('🔌 API response received');
      console.log('🔌 Response status:', response.status);
      console.log('🔌 Response ok:', response.ok);
      console.log('🔌 Response headers:', response.headers);

      if (!response.ok) {
        console.log('❌ API response not ok:', response.status, response.statusText);
        throw new Error('Failed to get API configuration');
      }

      const data = await response.json();
      console.log('🔌 API response data:', data);

      const { apiKey, model, instructions } = data;

      console.log('🔑 API key received:', apiKey.substring(0, 10) + '...');
      console.log('🔑 API key length:', apiKey.length);
      console.log('🔑 Model:', model);

      // Initialize audio right after API key is retrieved
      console.log('🎤 Initializing audio pipeline...');
      try {
        await initializeAudio();
        console.log('✅ Audio pipeline initialized successfully');
      } catch (audioError) {
        console.log('❌ Audio pipeline initialization failed:', audioError);
        // Don't throw error here - let user try recording manually
      }

      // Create WebSocket connection to OpenAI Realtime API with auto-fixing
      const createWebSocketWithFallback = (apiKey: string, model: string) => {
        const methods = [
          {
            name: 'subprotocol-openai-insecure',
            create: () => new WebSocket(
              `wss://api.openai.com/v1/realtime?model=${model}`,
              ['realtime', `openai-insecure-api-key.${apiKey}`]
            )
          },
          {
            name: 'subprotocol-bearer',
            create: () => new WebSocket(
              `wss://api.openai.com/v1/realtime?model=${model}`,
              ['realtime', `Bearer ${apiKey}`.replace(/ /g, '_')]
            )
          },
          {
            name: 'query-bearer',
            create: () => new WebSocket(
              `wss://api.openai.com/v1/realtime?model=${model}&authorization=${encodeURIComponent(`Bearer ${apiKey}`)}`
            )
          },
          {
            name: 'query-api-key',
            create: () => new WebSocket(
              `wss://api.openai.com/v1/realtime?model=${model}&api_key=${encodeURIComponent(apiKey)}`
            )
          }
        ];

        let currentMethodIndex = 0;

        const tryNextMethod = () => {
          if (currentMethodIndex >= methods.length) {
            console.error('🔌 All authentication methods failed');
            setConnectionError('All authentication methods failed');
            setState('error');
            return null;
          }

          const method = methods[currentMethodIndex];
          console.log(`🔌 Trying authentication method: ${method.name}`);
          
          const ws = method.create();
          
          const originalOnerror = ws.onerror;
          const originalOnclose = ws.onclose;
          
          ws.onerror = (error) => {
            console.error(`🔌 Method ${method.name} failed:`, error);
            currentMethodIndex++;
            
            if (currentMethodIndex < methods.length) {
              console.log(`🔌 Trying next method...`);
              setTimeout(() => tryNextMethod(), 1000);
            } else {
              originalOnerror?.call(ws, error);
            }
          };
          
          ws.onclose = (event) => {
            if (event.code !== 1000) { // Not a normal close
              console.log(`🔌 Method ${method.name} closed with code ${event.code}: ${event.reason}`);
              currentMethodIndex++;
              
              if (currentMethodIndex < methods.length && event.code === 1006) {
                console.log(`🔌 Trying next method...`);
                setTimeout(() => tryNextMethod(), 1000);
              } else {
                originalOnclose?.call(ws, event);
              }
            } else {
              originalOnclose?.call(ws, event);
            }
          };
          
          return ws;
        };

        return tryNextMethod();
      };

      const ws = createWebSocketWithFallback(apiKey, model);

      if (ws) {
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
              console.log('🎉 SUCCESS: WebSocket connection and session working!');
              break;
              
            case 'session.created':
              // Session successfully created (alternative event)
              console.log('✅ Session created successfully:', data.session);
              console.log('� SUCCESS: WebSocket connection and session working!');
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
              if (data.type === 'response.text.done') {
                console.log('🎉 SUCCESS: Got AI response!');
              }
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
      }

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
    console.log('🎤 Start recording called');
    console.log('🎤 Current state before recording:', state);
    console.log('🎤 Analyser exists:', !!analyserRef.current);
    console.log('🎤 Audio context state:', audioContextRef.current?.state);
    
    // Audio capture is now handled automatically by the Web Audio API processor
    setState('listening');
    console.log('🎤 State set to listening');
    
    // Start audio level monitoring immediately
    console.log('🎤 Starting audio level monitoring...');
    monitorAudioLevel();
  }, [setState, monitorAudioLevel, state]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('🔇 Stop recording called');
    console.log('🔇 Current state before stopping:', state);
    console.log('🔇 WebSocket readyState:', websocketRef.current?.readyState);
    console.log('🔇 WebSocket exists:', !!websocketRef.current);
    
    // Audio capture stops automatically when state changes from 'listening'
    setState('thinking');
    console.log('🔇 State set to thinking');
    
    // Trigger response generation
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔇 Sending response.create to OpenAI');
      const responseMessage = JSON.stringify({
        type: 'response.create'
      });
      console.log('🔇 Message to send:', responseMessage);
      
      websocketRef.current.send(responseMessage);
      console.log('🔇 response.create sent successfully');
    } else {
      console.log('❌ WebSocket not ready for response.create');
      console.log('❌ WebSocket readyState:', websocketRef.current?.readyState);
    }
  }, [setState, state]);

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
