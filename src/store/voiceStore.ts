import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceStateEnum = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

interface VisualAid {
  word: string;
  imageQuery: string;
  imageUrl: string;
  isVisible: boolean;
}

interface VoiceStore {
  // Current voice state
  state: VoiceStateEnum;
  
  // UI View state
  currentView: 'gender' | 'avatar' | 'call';
  
  // User profile
  userProfile: UserProfile | null;
  
  // Kid's gender
  kidGender: 'boy' | 'girl' | null;
  
  // Gamification
  starCount: number;
  
  // Connection details
  isConnected: boolean;
  connectionError: string | null;
  
  // Audio levels
  audioLevel: number; // 0-100
  
  // Session info
  sessionId: string | null;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  
  // Visual aid
  visualAid: VisualAid | null;
  
  // Actions
  setState: (state: VoiceStateEnum) => void;
  setCurrentView: (view: 'gender' | 'avatar' | 'call') => void;
  setProfile: (profile: UserProfile) => void;
  setKidGender: (kidGender: 'boy' | 'girl' | null) => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setAudioLevel: (level: number) => void;
  setSessionId: (id: string | null) => void;
  addConversationMessage: (role: 'user' | 'assistant', content: string) => void;
  incrementStarCount: () => void;
  setVisualAid: (visualAid: VisualAid | null) => void;
  disconnect: () => void;
  reset: () => void;
}

const initialState = {
  state: 'idle' as const,
  currentView: 'gender' as const,
  isConnected: false,
  connectionError: null,
  sessionId: null,
  audioLevel: 0,
  conversationHistory: [],
  userProfile: null,
  kidGender: null,
  starCount: 0,
  visualAid: null,
};

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setState: (state) => set({ state }),
      
      setCurrentView: (currentView) => set({ currentView }),
      
      setProfile: (userProfile) => set({ userProfile }),
      
      setKidGender: (kidGender) => set({ kidGender }),
      
      setConnected: (isConnected) => set({ isConnected }),
      
      setConnectionError: (error) => set({ connectionError: error }),
      
      setAudioLevel: (audioLevel) => set({ audioLevel }),
      
      setSessionId: (sessionId) => set({ sessionId }),
      
      setVisualAid: (visualAid) => set({ visualAid }),
      
      addConversationMessage: (role, content) => {
        const message = {
          role,
          content,
          timestamp: new Date(),
        };
        
        set((state) => ({
          conversationHistory: [...state.conversationHistory, message],
        }));
      },
      
      incrementStarCount: () => {
        const newCount = get().starCount + 1;
        console.log('🌟 STAR AWARDED! Current count:', newCount);
        set((state) => ({ starCount: newCount }));
      },
      
      disconnect: () => {
        set({
          state: 'idle',
          isConnected: false,
          connectionError: null,
          sessionId: null,
          audioLevel: 0,
          visualAid: null
        });
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'koko-talk-store',
      partialize: (state) => ({
        currentView: state.currentView,
        userProfile: state.userProfile,
        kidGender: state.kidGender,
        starCount: state.starCount,
        conversationHistory: state.conversationHistory,
      }),
      skipHydration: true,
    }
  )
);
