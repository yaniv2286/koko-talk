'use client';

// Cache bust: 2025-03-11-21-22
import { useCallback, useRef, useEffect } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

console.log('🔄 useRealtimeAudio.ts loaded with fresh code - 2025-03-11-21-22');

interface UseRealtimeAudioProps {
  onError?: (error: string) => void;
  onAudioLevelChange?: (level: number) => void;
}

export const useRealtimeAudio = ({ 
  onError, 
  onAudioLevelChange 
}: UseRealtimeAudioProps = {}) => {
  const { 
    state, 
    setState, 
    setConnected, 
    setConnectionError, 
    setSessionId, 
    addConversationMessage,
    incrementStarCount,
    reset,
    userProfile,
    kidGender,
    setVisualAid
  } = useVoiceStore();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize WebRTC connection
  const connect = useCallback(async () => {
    try {
      console.log('🔗 Starting WebRTC connection...');
      // NOTE: Removed star count reset to prevent state reset that breaks routing
      
      setState('connecting');
      setConnectionError(null);

      // Fetch ephemeral token from API
      const requestData = {
        userProfile: userProfile || undefined,
        kidGender: kidGender || undefined
      };
      console.log('📤 Sending to API:', requestData);
      
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      console.log('📡 API response received, status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to get ephemeral token');
      }

      const { ephemeralToken } = await response.json();
      console.log('🔑 Ephemeral token received');

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Create hidden audio element for playback
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      // Handle incoming tracks (Koko's voice)
      pc.ontrack = (event) => {
        console.log('🎵 Received audio track from OpenAI');
        audioEl.srcObject = event.streams[0];
        setState('speaking');
      };

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      // Trigger initial response when data channel opens
      dc.addEventListener('open', () => {
        console.log('🌐 Data channel opened, triggering initial response...');
        
        // Let the main system instructions handle the greeting naturally
        const createResponse = {
          type: 'response.create',
          response: {
            modalities: ['text', 'audio']
          }
        };
        console.log('📤 Sending initial response:', createResponse);
        dc.send(JSON.stringify(createResponse));
      });

      // Handle data channel messages
      dc.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received WebRTC event:', data.type);

          switch (data.type) {
            case 'response.created':
              console.log('🎤 Response created:', data);
              console.log('🎤 Response details:', JSON.stringify(data.response, null, 2));
              break;
            case 'response.audio.delta':
              console.log('🔊 Audio delta received:', data);
              setState('speaking');
              break;
            case 'response.audio.done':
              console.log('🔊 Audio response done:', data);
              setState('listening');
              break;
            case 'response.text.delta':
              console.log('💬 Text delta:', data.delta);
              break;
            case 'response.text.done':
              console.log('💬 Full response:', data.text);
              addConversationMessage('assistant', data.text);
              setState('listening');
              break;
            case 'response.done':
              console.log('✅ Response completed:', data);
              console.log('✅ Response content details:', JSON.stringify(data.response, null, 2));
              break;
            case 'response.function_call_arguments.done':
              console.log('⭐ Function call complete:', data.name);
              if (data.name === 'award_star') {
                incrementStarCount();
                
                // Acknowledge the function call back to OpenAI
                if (dcRef.current && dcRef.current.readyState === 'open') {
                  dcRef.current.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: data.call_id,
                      output: JSON.stringify({ success: true, message: "Star awarded to the user!" })
                    }
                  }));
                  // Trigger the AI to continue the conversation after awarding the star
                  dcRef.current.send(JSON.stringify({ type: 'response.create' }));
                }
              } else if (data.name === 'show_spelling') {
                console.log('🎯 Spelling aid requested:', data.arguments);
                
                // Parse arguments safely - OpenAI often sends as string
                let args;
                try {
                  args = typeof data.arguments === 'string' 
                    ? JSON.parse(data.arguments) 
                    : data.arguments;
                } catch (error) {
                  console.error('🎯 Failed to parse spelling arguments:', error);
                  return;
                }
                
                const { word } = args || {};
                
                // Validate required fields
                if (!word) {
                  console.error('🎯 Missing required spelling word:', { word });
                  return;
                }
                
                console.log('🖼️ Spelling aid triggered for:', word);
                
                // Show visual aid in UI
                setVisualAid({
                  word,
                  imageQuery: word, // Use word as image query
                  imageUrl: '',
                  isVisible: true
                });
                
                // Acknowledge the function call back to OpenAI
                if (dcRef.current && dcRef.current.readyState === 'open') {
                  dcRef.current.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: data.call_id,
                      output: JSON.stringify({ word })
                    }
                  }));
                  // Trigger the AI to continue the conversation after showing spelling
                  dcRef.current.send(JSON.stringify({ type: 'response.create' }));
                }
              }
              break;
            case 'error':
              console.error('❌ WebRTC error:', data);
              setConnectionError(data.error?.message || 'Unknown WebRTC error');
              setState('idle');
              break;
            default:
              console.log('📨 Unhandled event:', data.type);
          }
        } catch (error) {
          console.error('📨 Error parsing WebRTC message:', error);
        }
      });

      // Get microphone access
      let mediaStream;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('🎤 Microphone not available in this browser/environment');
          setConnectionError('Please allow microphone access to use Koko. Click the microphone icon in your browser address bar to enable.');
          setState('error');
          return;
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000 // Lower sample rate for voice focus
          }
        });
      } catch (error) {
        console.warn('🎤 Microphone access denied:', error);
        setConnectionError('Microphone access required. Please allow microphone permissions and refresh the page to try again.');
        setState('error');
        return;
      }
      
      mediaStreamRef.current = mediaStream;
      
      // Add microphone track to peer connection
      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      console.log('🎤 Microphone connected');

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📤 WebRTC offer created');

      // Send offer to OpenAI
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to exchange SDP with OpenAI');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      console.log('📥 WebRTC connection established');
      setState('listening');
      setConnected(true);
      setSessionId(ephemeralToken);

      // Initialize audio context and analyser
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Connect microphone to analyser for level monitoring
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);

      // Monitor audio levels
      const monitorAudioLevel = () => {
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
      };

      monitorAudioLevel();

    } catch (error) {
      console.error('🔗 WebRTC connection error:', error);
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
    incrementStarCount,
    onError,
    onAudioLevelChange,
    userProfile
  ]);

  // Start recording (open mic)
  const startRecording = useCallback(() => {
    if (pcRef.current && mediaStreamRef.current) {
      console.log('🎤 Starting continuous streaming');
      setState('listening');
    } else {
      console.error('🎤 Cannot start recording - WebRTC not initialized');
    }
  }, []);

  // Stop recording (close mic)
  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      console.log('🎤 Microphone stopped');
    }
    setState('idle');
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setConnected(false);
    setState('idle');
    setSessionId(null);
    console.log('🔌 WebRTC disconnected');
  }, [setConnected, setState, setSessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Direct cleanup without calling disconnect to avoid circular dependency
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (dcRef.current) {
        dcRef.current.close();
        dcRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setConnected(false);
      setState('idle');
      setSessionId(null);
      console.log('🔌 WebRTC disconnected on unmount');
    };
  }, [setConnected, setState, setSessionId]);

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isConnected: state !== 'idle' && state !== 'error' && state !== 'connecting',
  };
};
