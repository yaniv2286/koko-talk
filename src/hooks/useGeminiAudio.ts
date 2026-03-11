'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

interface UseGeminiAudioProps {
  onError?: (error: string) => void;
  onAudioLevelChange?: (level: number) => void;
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
    kidGender
  } = useVoiceStore();

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Initialize Gemini-based connection
  const connect = useCallback(async () => {
    try {
      console.log('🔗 Starting Gemini connection...');
      setState('connecting');
      setConnectionError(null);

      // Get initial greeting from Gemini
      const response = await fetch('/api/gemini-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: userProfile || undefined,
          kidGender: kidGender || undefined
        }),
      });
      
      console.log('📡 Gemini API response received, status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to get Gemini response');
      }

      const { response: text } = await response.json();
      console.log('🔑 Gemini response received:', text);

      // Add to conversation
      addConversationMessage('assistant', text);
      
      // For now, just simulate audio (we'll add TTS later)
      setState('listening');
      setConnected(true);
      setSessionId('gemini-session');

    } catch (error) {
      console.error('🔗 Gemini connection error:', error);
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
    onAudioLevelChange,
    userProfile,
    kidGender
  ]);

  // Send message to Gemini
  const sendMessage = useCallback(async (message: string) => {
    try {
      if (!state || state === 'error') {
        throw new Error('Not connected');
      }

      console.log('📤 Sending message to Gemini:', message);
      
      // Add user message to conversation
      addConversationMessage('user', message);

      // Get response from Gemini
      const response = await fetch('/api/gemini-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: userProfile || undefined,
          kidGender: kidGender || undefined,
          message: message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Gemini response');
      }

      const { response: text } = await response.json();
      console.log('📨 Gemini response:', text);

      // Add AI response to conversation
      addConversationMessage('assistant', text);

    } catch (error) {
      console.error('📤 Message send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setConnectionError(errorMessage);
      onError?.(errorMessage);
    }
  }, [state, userProfile, kidGender, addConversationMessage, setConnectionError, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting Gemini connection...');
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setState('idle');
    setConnected(false);
    setSessionId(null);
  }, [setState, setConnected, setSessionId]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: state !== 'idle' && state !== 'error' && state !== 'connecting',
  };
};
