'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

interface UseGeminiAudioProps {
  kidGender?: 'boy' | 'girl' | null;
  tutorId?: string;
  onError?: (error: string) => void;
  onAudioLevelChange?: (level: number) => void;
}

interface SetupConfig {
  generationConfig: any;
  systemInstruction: { parts: { text: string }[] };
  tools: any[];
  responseModalities: string[];
  speechConfig: any;
}

export const useGeminiAudio = ({ 
  kidGender: propKidGender,
  tutorId: propTutorId,
  onError, 
  onAudioLevelChange 
}: UseGeminiAudioProps = {}) => {
  const { 
    state, 
    setState, 
    setConnected, 
    setConnectionError, 
    setSessionId,
    addConversationMessage,
    incrementStarCount,
    setVisualAid,
    userProfile,
    kidGender: storeKidGender,
    conversationHistory
  } = useVoiceStore();

  // Use prop values if provided, otherwise fall back to store values
  const kidGender = propKidGender || storeKidGender;
  const tutorId = propTutorId || userProfile?.id || 'koko';

  // Keep refs synced with latest state values
  useEffect(() => {
    liveStateRef.current = state;
  }, [state]);

  useEffect(() => {
    tutorIdRef.current = tutorId;
  }, [tutorId]);

  useEffect(() => {
    kidGenderRef.current = kidGender;
  }, [kidGender]);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const setupConfigRef = useRef<SetupConfig | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const nextAudioTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<Int16Array[]>([]);
  const lastSendTimeRef = useRef<number>(0);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioProcessCountRef = useRef<number>(0);
  const isFirstGreetingRef = useRef<boolean>(true);
  const userSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasGreetedRef = useRef<boolean>(false);
  const liveStateRef = useRef(state);
  const tutorIdRef = useRef(tutorId);
  const kidGenderRef = useRef(kidGender);

  // Initialize Web Audio API
  const initializeAudioContext = useCallback(async () => {
    try {
      console.log('🎵 Initializing Web Audio API...');
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      // Unlock AudioContext autoplay policy
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('🔓 AudioContext resumed from suspended state');
      }

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      mediaStreamRef.current = stream;

      // Create audio source from microphone
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create ScriptProcessorNode for raw audio processing (1024 buffer size for ultra-low latency, 1 input channel, 1 output channel)
      processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      
      // Create GainNode and mute it to prevent feedback loops while keeping pipeline active
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0; // Silent Vacuum - mute output but keep processor firing
      
      // Process raw Float32 audio samples with downsampling
      processorRef.current.onaudioprocess = (e) => {
        // 1. FULL DUPLEX: Always listen if socket is open. Ignore UI state.
        if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const compressionRatio = audioContextRef.current!.sampleRate / 16000;
        const downsampledLength = Math.floor(inputData.length / compressionRatio);
        const pcm16 = new Int16Array(downsampledLength);

        for (let i = 0; i < downsampledLength; i++) {
          // 2. Downsample and apply 500% Gain Boost
          let sample = inputData[Math.floor(i * compressionRatio)] * 5.0;

          // 3. Mathematical Clamp (Prevents audio distortion/crashing)
          sample = Math.max(-1, Math.min(1, sample));

          // 4. Convert to PCM16
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // 7. Fast Base64 Encoding
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }

        // 8. Stream to Gemini
        websocketRef.current.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm;rate=16000",
              data: btoa(binary)
            }]
          }
        }));
      };
      
      // Connect the Silent Vacuum pipeline (source → processor → muted gain → destination)
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      console.log('🎙️ Silent Vacuum pipeline connected (muted output, active processor)');
      
      console.log('✅ Web Audio API initialized');
      
    } catch (error) {
      console.error('🚨 AUDIO INITIALIZATION FAILURE:', error);
      const errorMessage = error instanceof Error ? error.message : 'Audio initialization failed';
      setConnectionError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  }, [setConnectionError, setState, onError]);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(async () => {
    try {
      console.log('🔗 Setting up Gemini Live WebSocket...');
      setState('connecting');
      setConnectionError(null);
      
      // Reset audio queue timing and greeting flag
      nextPlayTimeRef.current = 0;
      hasGreetedRef.current = false;

      let websocketUrl: string;
      let setupConfig: any;

      try {
        console.log('📡 Fetching WebSocket config from /api/gemini-live...');
        const response = await fetch('/api/gemini-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfile: userProfile || undefined,
            kidGender: kidGender || undefined
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`🚨 BACKEND ERROR (${response.status}):`, errorText);
          throw new Error(`API Route Failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.websocketUrl || !data.setupConfig) {
          console.error('🚨 INVALID PAYLOAD:', data);
          throw new Error('Backend returned invalid WebSocket configuration.');
        }

        websocketUrl = data.websocketUrl;
        setupConfig = data.setupConfig;
        setupConfigRef.current = setupConfig;
        console.log('✅ Configuration received. Connecting to WebSocket...');

      } catch (err) {
        console.error('💥 SETUP FATAL ERROR:', err);
        setState('error');
        setConnectionError(err instanceof Error ? err.message : 'Failed to setup WebSocket');
        return;
      }

      console.log('🚀 Attempting Handshake: v1alpha + gemini-2.0-flash-exp');
      const websocket = new WebSocket(websocketUrl);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('✅ WebSocket connected, sending setup config...');
        
        // Dynamic Voice Routing Matrix - Evaluated INSIDE onopen to use live ref values
        const currentTutor = tutorIdRef.current;
        const currentGender = kidGenderRef.current;
        const isCat = currentTutor === 'mimi';
        const tutorName = isCat ? 'Mimi the Cat' : 'Koko the Dog';
        const tutorType = isCat ? 'cat' : 'dog';
        const voiceSelection = isCat ? 'Aoede' : 'Puck'; // Aoede = Female, Puck = Male
        const grammarRule = currentGender === 'boy' ? 'masculine (זכר)' : 'feminine (נקבה)';

        console.log(`🎭 LIVE EVALUATION - Tutor: ${tutorName}, Voice: ${voiceSelection}, Grammar: ${grammarRule}`);
        
        // 1. Send Setup Config with Dynamic Voice and Behavioral Rules
        websocket.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceSelection } }
              }
            },
            systemInstruction: {
              parts: [{
                text: `You are ${tutorName}, a highly energetic, friendly AI English tutor for Israeli users. 
CRITICAL RULES:
1. IDENTITY: You are a friendly ${tutorType}. You must NEVER call yourself 'Morah' or 'Teacher'.
2. GRAMMAR: You are talking to a ${currentGender}. You MUST use strictly correct ${grammarRule} Hebrew grammar at all times.
3. LANGUAGE: Speak 95% in natural, friendly Israeli Hebrew, and 5% in English to teach new words organically.
4. CONVERSATION: Keep responses VERY short (1-2 sentences max). Always end your turn with a short, engaging question. Do not ramble.
5. AGE ADAPTATION: You do not know the user's age yet. Once they tell you, adapt your vocabulary. If young, use simple words and talk about games/animals. If an adult, use sophisticated vocabulary and adult contexts (work/hobbies), but maintain your ${tutorType} persona.
6. KILL SWITCH: If the user says "Goodbye", "Bye", "להתראות", or asks to end the call, say a warm, quick goodbye and stop talking.`
              }]
            }
          }
        }));

        // DO NOT send greeting here - it will be sent after microphone initialization in startRecording()
        
        setState('idle');
        setConnected(true);
        setSessionId('gemini-live-session');
      };

      websocket.onmessage = async (event) => {
        try {
          // Handle Blob data (could be JSON text or binary audio)
          if (event.data instanceof Blob) {
            const arrayBuffer = await event.data.arrayBuffer();
            
            // Try to decode as JSON first
            try {
              const text = new TextDecoder().decode(arrayBuffer);
              const data = JSON.parse(text);
              // Successfully parsed as JSON - handle as JSON message
              console.log('📨 WebSocket message (Blob->JSON):', JSON.stringify(data, null, 2));
              
              if (data.setupComplete) {
                console.log('✅ Gemini Setup Complete. Server is ready.');

                // Fire greeting exactly once when server confirms readiness
                if (!hasGreetedRef.current && websocket.readyState === WebSocket.OPEN) {
                  hasGreetedRef.current = true;
                  
                  // Dynamic evaluation - use live ref values
                  const currentTutor = tutorIdRef.current;
                  const tutorName = currentTutor === 'mimi' ? 'Mimi the Cat' : 'Koko the Dog';
                  
                  console.log(`🗣️ Triggering Initial Greeting for ${tutorName}...`);
                  websocket.send(JSON.stringify({
                    clientContent: {
                      turns: [{ role: "user", parts: [{ text: `Hello! Please start the conversation. Introduce yourself as ${tutorName} in Hebrew, and immediately ask me how old I am so you know how to teach me.` }] }],
                      turnComplete: true
                    }
                  }));
                  setState('listening');
                }
              }
              
              // Process JSON data (tool calls, text, etc.)
              if (data.toolCall) {
                console.log('🛠️ Tool called:', data.toolCall);
                const { functionCalls } = data.toolCall;
                
                if (functionCalls && functionCalls.length > 0) {
                  for (const call of functionCalls) {
                    const { name, args, id } = call;
                    
                    if (name === 'award_star') {
                      incrementStarCount();
                      console.log('⭐ Star awarded!');
                    }
                    
                    if (name === 'show_spelling' && args?.word) {
                      setVisualAid({
                        word: args.word,
                        imageQuery: args.word,
                        imageUrl: '',
                        isVisible: true
                      });
                      console.log('🔤 Spelling aid shown:', args.word);
                    }
                    
                    // Send tool response
                    websocket.send(JSON.stringify({
                      toolResponse: {
                        functionResponses: [{
                          id: id || Date.now().toString(),
                          name: name,
                          response: { success: true }
                        }]
                      }
                    }));
                  }
                }
              }

              // Handle audio content (Base64 PCM16)
              if (data.serverContent?.modelTurn?.parts) {
                for (const part of data.serverContent.modelTurn.parts) {
                  // Skip thought messages
                  if (part.thought) continue;
                  
                  // Handle Base64-encoded audio
                  if (part.inlineData?.mimeType === 'audio/pcm;rate=24000' && part.inlineData?.data) {
                    
                    const ctx = playbackContextRef.current;
                    if (ctx && part.inlineData && part.inlineData.data) {
                      try {
                        // 1. Force context awake if browser suspended it
                        if (ctx.state === 'suspended') ctx.resume();

                        // 2. Decode Base64 to Binary
                        const base64Audio = part.inlineData.data;
                        const binaryString = atob(base64Audio);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }

                        // 3. Convert to Float32 and BOOST VOLUME by 3x
                        const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
                        const float32Array = new Float32Array(int16Array.length);
                        for (let i = 0; i < int16Array.length; i++) {
                          float32Array[i] = (int16Array[i] / 32768.0) * 3.0; // 300% Gain Boost
                        }

                        // 4. Schedule Playback
                        const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
                        audioBuffer.getChannelData(0).set(float32Array);

                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination); // Connect directly to raw speakers

                        const currentTime = ctx.currentTime;
                        if (nextAudioTimeRef.current < currentTime) {
                          nextAudioTimeRef.current = currentTime + 0.05;
                        }

                        source.start(nextAudioTimeRef.current);
                        nextAudioTimeRef.current += audioBuffer.duration;
                        console.log(`🔊 AMPLIFIED PLAYBACK - Context: ${ctx.state}, Volume: 3x`);
                        setState('speaking');
                        
                        // Rely on Gemini's native VAD - no local silence detection
                        if (isFirstGreetingRef.current) {
                          isFirstGreetingRef.current = false;
                          console.log('✅ First greeting complete - microphone now active');
                        }
                      } catch (audioError) {
                        console.error('🚨 AUDIO PLAYBACK ERROR:', audioError);
                      }
                    } else {
                      console.warn('⚠️ Playback context not initialized!');
                    }
                  }
                  
                  // Handle text content
                  if (part.text) {
                    console.log('💬 Text:', part.text);
                    addConversationMessage('assistant', part.text);
                  }
                }
              }
              
              // State transitions
              if (data.serverContent?.turnComplete) {
                console.log('✅ Turn complete');
                setState('listening');
              }
              return;
            } catch (jsonError) {
              // Not JSON - treat as binary audio data
              console.log('🎵 Received audio Blob:', arrayBuffer.byteLength, 'bytes');
              
              if (audioContextRef.current && arrayBuffer.byteLength % 2 === 0) {
                const int16Array = new Int16Array(arrayBuffer);
                const float32Array = new Float32Array(int16Array.length);
                
                // Convert PCM16 to Float32
                for (let i = 0; i < int16Array.length; i++) {
                  float32Array[i] = int16Array[i] / 32768.0;
                }

                // Play Audio (Gemini outputs 24kHz)
                const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
                audioBuffer.getChannelData(0).set(float32Array);
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                
                console.log('🔊 Audio playing:', float32Array.length, 'samples');
                setState('speaking');
              } else if (arrayBuffer.byteLength % 2 !== 0) {
                console.warn('⚠️ Skipping odd-byte Blob (not valid PCM16):', arrayBuffer.byteLength, 'bytes');
              }
              return;
            }
          }

          // Handle string JSON messages
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', JSON.stringify(data, null, 2));
          
          if (data.setupComplete) console.log('✅ Gemini Setup Complete');
          
          // Tool Calls
          if (data.toolCall) {
            console.log('🛠️ Tool called:', data.toolCall);
            const { functionCalls } = data.toolCall;
            
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                const { name, args, id } = call;
                
                if (name === 'award_star') {
                  incrementStarCount();
                  console.log('⭐ Star awarded!');
                }
                
                if (name === 'show_spelling' && args?.word) {
                  setVisualAid({
                    word: args.word,
                    imageQuery: args.word,
                    imageUrl: '',
                    isVisible: true
                  });
                  console.log('🔤 Spelling aid shown:', args.word);
                }
                
                // Send tool response
                websocket.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [{
                      id: id || Date.now().toString(),
                      name: name,
                      response: { success: true }
                    }]
                  }
                }));
              }
            }
          }

          // Handle text content
          if (data.serverContent?.modelTurn?.parts) {
            const textPart = data.serverContent.modelTurn.parts.find((p: any) => p.text);
            if (textPart) {
              console.log('💬 Text:', textPart.text);
              addConversationMessage('assistant', textPart.text);
            }
          }
          
          // State transitions
          if (data.serverContent?.turnComplete) {
            console.log('✅ Turn complete');
            setState('listening');
          }
          
        } catch (error) {
          console.error('🚨 WebSocket Message Error:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('🚨 WEBSOCKET ERROR:', error);
        const errorMessage = 'WebSocket connection error';
        setConnectionError(errorMessage);
        setState('error');
        onError?.(errorMessage);
      };

      websocket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setState('idle');
        setConnected(false);
        setSessionId(null);
        
        if (event.code !== 1000) {
          const errorMessage = `WebSocket closed unexpectedly: ${event.reason}`;
          setConnectionError(errorMessage);
          onError?.(errorMessage);
        }
      };

    } catch (error) {
      console.error('🚨 WEBSOCKET SETUP FAILURE:', error);
      const errorMessage = error instanceof Error ? error.message : 'WebSocket setup failed';
      setConnectionError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  }, [setState, setConnected, setSessionId, setConnectionError, onError, userProfile, kidGender, addConversationMessage, incrementStarCount, setVisualAid]);

  // Start recording (continuous streaming)
  const startRecording = useCallback(async () => {
    console.log('🎤🎤🎤 startRecording CALLED - ENTRY POINT');
    try {
      console.log('🎤 Starting continuous audio streaming...');
      console.log('🎤 WebSocket state:', websocketRef.current?.readyState);
      
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        console.log('🎤 WebSocket not open, calling setupWebSocket...');
        await setupWebSocket();
      }
      
      // Initialize dedicated playback context (isolated from microphone)
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      console.log('🔊 Dedicated playback AudioContext created');
      
      console.log('🎤 About to call initializeAudioContext...');
      await initializeAudioContext();
      console.log('🎤 initializeAudioContext completed');
      console.log('⏳ Waiting for setupComplete event from Gemini before sending greeting...');

    } catch (error) {
      console.error('🚨 RECORDING START FAILURE:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setConnectionError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  }, [setupWebSocket, initializeAudioContext, setState, setConnectionError, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping audio streaming...');
    
    // Disconnect audio processing chain
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setState('idle');
    console.log('✅ Audio streaming stopped');
  }, [setState]);

  // Send text message (fallback)
  const sendMessage = useCallback(async (message: string) => {
    try {
      console.log('💬 Sending text message via WebSocket:', message);
      
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          clientContent: {
            parts: [{
              text: message
            }]
          }
        }));
        
        addConversationMessage('user', message);
        setState('thinking');
        
      } else {
        throw new Error('WebSocket not connected');
      }

    } catch (error) {
      console.error('🚨 WEBSOCKET MESSAGE FAILURE:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setConnectionError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  }, [setState, addConversationMessage, setConnectionError, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting Gemini Live...');
    
    try {
      // Stop audio processing
      stopRecording();
      
      // Close WebSocket
      if (websocketRef.current) {
        websocketRef.current.close(1000, 'User disconnect');
        websocketRef.current = null;
      }
      
      // Reset state
      setState('idle');
      setConnected(false);
      setSessionId(null);
      setConnectionError(null);
      nextAudioTimeRef.current = 0;
      
      console.log('✅ Disconnected successfully');
      
    } catch (error) {
      console.error('🚨 DISCONNECT FAILURE:', error);
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed';
      setConnectionError(errorMessage);
      onError?.(errorMessage);
    }
  }, [stopRecording, setState, setConnected, setSessionId, setConnectionError, onError]);

  // Initialize connection
  const initialize = useCallback(async () => {
    await setupWebSocket();
  }, [setupWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    initialize,
    startRecording,
    stopRecording,
    sendMessage,
    disconnect,
    isConnected: state !== 'idle' && state !== 'error' && state !== 'connecting',
    isRecording: mediaStreamRef.current?.active || false
  };
};
