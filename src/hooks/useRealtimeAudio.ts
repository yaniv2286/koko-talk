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
    userProfile,
    incrementStarCount,
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
      console.log('FRONTEND: Starting connection...');
      setState('connecting');
      setConnectionError(null);

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: userProfile || undefined
        }),
      });
      
      console.log('FRONTEND: API response received, status:', response.status);

      if (!response.ok) {
        console.log('FRONTEND: Response not ok');
        throw new Error('Failed to get API configuration');
      }

      const { apiKey, model, instructions } = await response.json();
      console.log('FRONTEND: API key received:', apiKey ? 'YES' : 'NO');

      if (!apiKey) {
        console.log('FRONTEND: No API key in response');
        throw new Error('No API key received from server');
      }

      // Initialize audio
      await initializeAudio();

      // Create WebSocket connection
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        ['realtime', `openai-insecure-api-key.${apiKey}`]
      );

      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('FRONTEND: WebSocket connected');
        setState('idle');
        setConnected(true);
        setSessionId(apiKey);
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            type: 'realtime',
            instructions: instructions,
          }
        }));
      };

      ws.onmessage = (event) => {
        console.log('FRONTEND: WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('FRONTEND: Parsed message type:', data.type);
          
          switch (data.type) {
            case 'session.updated':
              console.log('FRONTEND: Session updated successfully');
              break;
            case 'response.audio.delta':
              console.log('FRONTEND: Audio delta received');
              setState('speaking');
              break;
            case 'response.audio.done':
              console.log('FRONTEND: Audio response done');
              setState('idle');
              break;
            case 'response.text.delta':
              console.log('FRONTEND: Text delta received:', data.delta);
              break;
            case 'response.text.done':
              console.log('FRONTEND: Got AI response:', data.text);
              addConversationMessage('assistant', data.text);
              setState('idle');
              break;
            case 'input_text.done':
              console.log('FRONTEND: User input transcript:', data.text);
              addConversationMessage('user', data.text);
              break;
            case 'response.done':
              console.log('FRONTEND: Response completed');
              setState('idle');
              // Increment star count for successful response
              incrementStarCount();
              break;
            case 'error':
              console.error('FRONTEND: OpenAI error:', data);
              setConnectionError(data.error?.message || 'Unknown OpenAI error');
              setState('error');
              break;
            default:
              console.log('FRONTEND: Unhandled message type:', data.type, data);
          }
        } catch (error) {
          console.error('FRONTEND: Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('FRONTEND: WebSocket closed');
        setConnected(false);
        // Graceful degradation - return to idle state instead of error
        setState('idle');
        setConnectionError('Oops! Connection lost. Tap to wake Koko up!');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Oops! Connection lost. Tap to wake Koko up!');
        setState('idle');
        setConnected(false);
      };

    } catch (error) {
      console.log('FRONTEND: Connection error:', error);
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
    initializeAudio,
    userProfile,
    incrementStarCount,
  ]);

  // Start recording and sending audio
  const startRecording = useCallback(() => {
    setState('listening');
    monitorAudioLevel();
  }, [setState, monitorAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('FRONTEND: stopRecording called');
    setState('thinking');
    
    // Trigger response generation
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'response.create'
      });
      console.log('FRONTEND: Sending message to OpenAI:', message);
      websocketRef.current.send(message);
      console.log('FRONTEND: Message sent successfully');
    } else {
      console.log('FRONTEND: WebSocket not ready, state:', websocketRef.current?.readyState);
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
