'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

interface UseGeminiAudioProps {
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
    kidGender,
    conversationHistory
  } = useVoiceStore();

  // Keep liveStateRef synced with Zustand state
  useEffect(() => {
    liveStateRef.current = state;
  }, [state]);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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
      
      // Create ScriptProcessorNode for raw audio processing (4096 buffer size, 1 input channel, 1 output channel)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Create GainNode and mute it to prevent feedback loops while keeping pipeline active
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0; // Silent Vacuum - mute output but keep processor firing
      
      // Process raw Float32 audio samples
      let processCount = 0;
      processorRef.current.onaudioprocess = (event) => {
        processCount++;
        if (processCount % 50 === 0) {
          console.log(`🎙️ onaudioprocess firing (${processCount} calls), liveState: ${liveStateRef.current}, isFirstGreeting: ${isFirstGreetingRef.current}, WS: ${websocketRef.current?.readyState}`);
        }
        
        // CRITICAL: Only process microphone when state is 'listening' AND first greeting is done (use liveStateRef to avoid stale closure)
        if (websocketRef.current?.readyState === WebSocket.OPEN && 
            liveStateRef.current === 'listening' && 
            !isFirstGreetingRef.current) {
          
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Hardware Diagnostic
          const volumeSum = inputData.reduce((a, b) => a + Math.abs(b), 0);
          if (volumeSum === 0) {
            console.warn('🔇 MIC IS DEAD: Captured volume is exactly 0. OS is blocking mic or wrong input device selected.');
          }
          
          // 1. Convert Float32 to PCM16 (exact math as specified)
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Detect silence vs speech (simple energy-based VAD)
          let energy = 0;
          for (let i = 0; i < pcm16.length; i++) {
            energy += Math.abs(pcm16[i]);
          }
          const avgEnergy = energy / pcm16.length;
          const isSpeech = avgEnergy > 500; // Threshold for speech detection
          
          if (isSpeech) {
            // 2. Convert PCM16 to Base64
            const uint8 = new Uint8Array(pcm16.buffer);
            let binary = '';
            for (let i = 0; i < uint8.byteLength; i++) {
              binary += String.fromCharCode(uint8[i]);
            }
            const base64Data = btoa(binary);
            
            console.log(`🎤 Sending ${pcm16.length} audio samples (energy: ${avgEnergy.toFixed(0)})`);
            
            // 3. Send strictly formatted realtimeInput
            websocketRef.current.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Data
                }]
              }
            }));
            
            // Reset silence timeout - user is still speaking
            if (userSpeechTimeoutRef.current) {
              clearTimeout(userSpeechTimeoutRef.current);
            }
            
            // Set timeout to detect end of user speech (1.5 seconds of silence)
            userSpeechTimeoutRef.current = setTimeout(() => {
              console.log('🎤 User finished speaking (1.5s silence), sending turnComplete=true');
              if (websocketRef.current?.readyState === WebSocket.OPEN) {
                websocketRef.current.send(JSON.stringify({
                  clientContent: {
                    turns: [{
                      role: "user",
                      parts: [{ text: "" }]
                    }],
                    turnComplete: true
                  }
                }));
              }
            }, 1500);
          }
        }
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

      // Get setup config from API
      const response = await fetch('/api/gemini-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: userProfile || undefined,
          kidGender: kidGender || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get Live API setup');
      }

      const { websocketUrl, setupConfig } = await response.json();
      setupConfigRef.current = setupConfig;

      // Create WebSocket connection
      console.log('🚀 Attempting Handshake: v1alpha + gemini-2.0-flash-live');
      const websocket = new WebSocket(websocketUrl);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('✅ WebSocket connected, sending setup config...');
        
        // 1. Send Setup Config with generationConfig
        websocket.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.0-flash-live",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
              }
            },
            systemInstruction: {
              parts: [{ text: "You are Koko, a friendly dog. You are speaking to a child. You must NEVER call yourself 'Morah'. Keep the conversation flowing naturally in Hebrew and English." }]
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
                  console.log('🗣️ Triggering Initial Greeting...');
                  websocket.send(JSON.stringify({
                    clientContent: {
                      turns: [{ role: "user", parts: [{ text: "Hello! Please introduce yourself EXACTLY with this phrase and nothing else: 'שלום אני קוקו, מה שלומך היום?'" }] }],
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
                    
                    if (audioContextRef.current) {
                      try {
                        // 1. FORCE THE BROWSER AUDIO ENGINE AWAKE
                        if (audioContextRef.current.state === 'suspended') {
                          audioContextRef.current.resume().then(() => console.log('🔊 AudioContext forced awake!'));
                        }

                        const base64Audio = part.inlineData.data;
                        const binaryString = atob(base64Audio);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

                        const int16Array = new Int16Array(bytes.buffer);
                        const float32Array = new Float32Array(int16Array.length);
                        for (let i = 0; i < int16Array.length; i++) float32Array[i] = int16Array[i] / 32768.0;

                        const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
                        audioBuffer.getChannelData(0).set(float32Array);

                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContextRef.current.destination);

                        // 2. BULLETPROOF QUEUING
                        const currentTime = audioContextRef.current.currentTime;
                        if (nextAudioTimeRef.current < currentTime) {
                          nextAudioTimeRef.current = currentTime + 0.05; // 50ms buffer to prevent crackling
                        }

                        source.start(nextAudioTimeRef.current);
                        nextAudioTimeRef.current += audioBuffer.duration;
                        console.log(`🔊 Playing chunk. Context State: ${audioContextRef.current.state}`);
                        setState('speaking');
                        
                        // Debounce: Clear any existing timeout and set a new one
                        // Transition to listening 1 second after the LAST audio chunk arrives
                        if (listeningTimeoutRef.current) {
                          clearTimeout(listeningTimeoutRef.current);
                        }
                        
                        listeningTimeoutRef.current = setTimeout(() => {
                          console.log('🎧 Audio finished (no new chunks for 1s), transitioning to listening');
                          setState('listening');
                          // Mark first greeting as complete after Koko finishes speaking
                          if (isFirstGreetingRef.current) {
                            isFirstGreetingRef.current = false;
                            console.log('✅ First greeting complete - microphone now active');
                          }
                        }, 1000);
                      } catch (audioError) {
                        console.error('❌ Audio decode error:', audioError);
                      }
                    }
                  }
                  
                  // Handle text content (but skip thoughts)
                  if (part.text && !part.thought) {
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
