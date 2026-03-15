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

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const setupConfigRef = useRef<SetupConfig | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<Int16Array[]>([]);
  const lastSendTimeRef = useRef<number>(0);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioProcessCountRef = useRef<number>(0);

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

      // Use MediaRecorder API (modern, reliable alternative to ScriptProcessorNode)
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN && state === 'listening') {
          console.log(`🎤 MediaRecorder data available: ${event.data.size} bytes`);
          
          // Convert WebM/Opus to PCM16
          const arrayBuffer = await event.data.arrayBuffer();
          const audioContext = new AudioContext({ sampleRate: 16000 });
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const channelData = audioBuffer.getChannelData(0);
          
          // Convert Float32 to Int16 PCM
          const pcm16 = new Int16Array(channelData.length);
          for (let i = 0; i < channelData.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32768));
          }
          
          // Convert to base64 and send
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          
          console.log(`🎤 Sending ${pcm16.length} audio samples`);
          
          websocketRef.current.send(JSON.stringify({
            clientContent: {
              turns: [{
                role: "user",
                parts: [{
                  inlineData: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64
                  }
                }]
              }],
              turnComplete: false
            }
          }));
          
          console.log('✅ Microphone audio sent to Gemini');
        }
      };

      // Start recording in 500ms chunks
      mediaRecorderRef.current.start(500);
      console.log('🎙️ MediaRecorder started (500ms chunks)');
      
      console.log('✅ Web Audio API initialized');
      
    } catch (error) {
      console.error('🚨 AUDIO INITIALIZATION FAILURE:', error);
      const errorMessage = error instanceof Error ? error.message : 'Audio initialization failed';
      setConnectionError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  }, [state, setConnectionError, setState, onError]);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(async () => {
    try {
      console.log('🔗 Setting up Gemini Live WebSocket...');
      setState('connecting');
      setConnectionError(null);
      
      // Reset audio queue timing
      nextPlayTimeRef.current = 0;

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
      console.log('🚀 Attempting Handshake: v1beta + gemini-2.5-flash-native-audio-latest');
      const websocket = new WebSocket(websocketUrl);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('✅ WebSocket connected, sending setup config...');
        
        // 1. Send Setup Config with generationConfig
        websocket.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
              responseModalities: ["AUDIO"]
            },
            systemInstruction: {
              parts: [{ text: `You are Morah Koko. You are speaking to a ${kidGender} in Hebrew. DO NOT ask if they want to learn a word. Keep conversation flowing continuously.` }]
            },
            tools: [{
              functionDeclarations: [
                { name: "award_star", description: "Reward the child" },
                { name: "show_spelling", description: "Show word", parameters: { type: "OBJECT", properties: { word: { type: "STRING" } }, required: ["word"] } }
              ]
            }]
          }
        }));

        // 2. Force Initial Greeting
        setTimeout(() => {
          console.log('🗣️ Triggering Initial Greeting...');
          if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: "Hello! I am ready to learn English. Please introduce yourself and ask me how I am doing today in Hebrew." }] }],
                turnComplete: true
              }
            }));
          } else {
            console.warn('⚠️ WebSocket not open, skipping greeting');
          }
        }, 1500);
        
        setState('listening');
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
              
              if (data.setupComplete) console.log('✅ Gemini Setup Complete');
              
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
                        // Decode Base64 to binary
                        const base64Audio = part.inlineData.data;
                        const binaryString = atob(base64Audio);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        
                        // Convert PCM16 to Float32
                        const int16Array = new Int16Array(bytes.buffer);
                        const float32Array = new Float32Array(int16Array.length);
                        for (let i = 0; i < int16Array.length; i++) {
                          float32Array[i] = int16Array[i] / 32768.0;
                        }
                        
                        // Create audio buffer at 24kHz
                        const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
                        audioBuffer.getChannelData(0).set(float32Array);
                        
                        // Schedule audio to play sequentially without gaps
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContextRef.current.destination);
                        
                        // Calculate when to start this chunk
                        const currentTime = audioContextRef.current.currentTime;
                        const startTime = Math.max(currentTime, nextPlayTimeRef.current);
                        
                        // Start playback at scheduled time
                        source.start(startTime);
                        
                        // Update next play time (duration = samples / sampleRate)
                        const duration = float32Array.length / 24000;
                        nextPlayTimeRef.current = startTime + duration;
                        
                        console.log('🔊 Queued audio:', float32Array.length, 'samples, start:', startTime.toFixed(3));
                        setState('speaking');
                        
                        // Debounce: Clear any existing timeout and set a new one
                        // Transition to listening 1 second after the LAST audio chunk arrives
                        if (listeningTimeoutRef.current) {
                          clearTimeout(listeningTimeoutRef.current);
                        }
                        
                        listeningTimeoutRef.current = setTimeout(() => {
                          console.log('🎧 Audio finished (no new chunks for 1s), transitioning to listening');
                          setState('listening');
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
    try {
      console.log('🎤 Starting continuous audio streaming...');
      
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        await setupWebSocket();
      }
      
      await initializeAudioContext();
      
      // Start continuous audio streaming
      setState('listening');
      console.log('✅ Continuous audio streaming started');

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
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
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
