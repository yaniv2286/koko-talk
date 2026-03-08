import { create } from 'zustand';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceStore {
  // Current voice state
  state: VoiceState;
  
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
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setAudioLevel: (level: number) => void;
  setSessionId: (id: string | null) => void;
  addConversationMessage: (role: 'user' | 'assistant', content: string) => void;
  reset: () => void;
}

const initialState = {
  state: 'idle' as VoiceState,
  isConnected: false,
  connectionError: null,
  audioLevel: 0,
  sessionId: null,
  conversationHistory: [],
};

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  ...initialState,
  
  setState: (state) => set({ state }),
  
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
  
  reset: () => set(initialState),
}));
