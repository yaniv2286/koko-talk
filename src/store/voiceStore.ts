import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';
export type AgeGroup = '4-7' | '8-12';

interface UserProfile {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  avatar: string;
}

interface VoiceStore {
  // Current voice state
  state: VoiceState;
  
  // User profile
  userProfile: UserProfile | null;
  
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
  
  // Actions
  setState: (state: VoiceState) => void;
  setProfile: (profile: UserProfile) => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setAudioLevel: (level: number) => void;
  setSessionId: (id: string | null) => void;
  addConversationMessage: (role: 'user' | 'assistant', content: string) => void;
  incrementStarCount: () => void;
  reset: () => void;
}

const initialState = {
  state: 'idle' as VoiceState,
  userProfile: null as UserProfile | null,
  starCount: 0,
  isConnected: false,
  connectionError: null,
  audioLevel: 0,
  sessionId: null,
  conversationHistory: [],
};

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setState: (state) => set({ state }),
      
      setProfile: (userProfile) => set({ userProfile }),
      
      setConnected: (isConnected) => set({ isConnected }),
      
      setConnectionError: (error) => set({ connectionError: error }),
      
      setAudioLevel: (audioLevel) => set({ audioLevel }),
      
      setSessionId: (sessionId) => set({ sessionId }),
      
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
      
      incrementStarCount: () => set((state) => ({ starCount: state.starCount + 1 })),
      
      reset: () => set(initialState),
    }),
    {
      name: 'koko-talk-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        starCount: state.starCount,
        conversationHistory: state.conversationHistory,
      }),
    }
  )
);
