# Koko Talk - Architecture Documentation

## Overview
Koko Talk is an AI-powered English tutoring application for Israeli children ages 4-12, featuring real-time voice conversation with visual learning aids. **NOW WITH GEMINI LIVE API** - Native audio streaming with WebSocket for low-latency bidirectional communication.

## Core Engine

### 🚀 CURRENT: Gemini Live API via WebSocket (Production)
- **Implementation**: WebSocket bidirectional streaming with native audio
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **API Version**: `v1alpha` (Google AI Generative Language Service)
- **Audio Input**: PCM16, 16kHz (downsampled from hardware rate)
- **Audio Output**: PCM16, 24kHz (native streaming)
- **Connection**: WebSocket with JSON message protocol
- **Authentication**: Google AI API Key (query parameter)
- **Route**: `/api/gemini-live`
- **Cost**: Significantly lower than OpenAI Realtime

### Audio Pipeline

#### Input Pipeline (Microphone → Gemini)
1. **Capture**: `getUserMedia()` → MediaStream (hardware rate: 44.1kHz or 48kHz)
2. **Processing**: ScriptProcessorNode (4096 buffer, deprecated but functional)
3. **Downsampling**: Mathematical nearest-neighbor downsampling to 16kHz
4. **Noise Gate**: Energy threshold (0.005) to filter silence
5. **Encoding**: Float32 → PCM16 → Base64
6. **Transmission**: WebSocket `realtimeInput` with `mediaChunks`

#### Output Pipeline (Gemini → Speakers)
1. **Reception**: WebSocket `serverContent.modelTurn.parts` with Base64 audio
2. **Decoding**: Base64 → PCM16 → Float32
3. **Volume Boost**: 3x gain amplification for audibility
4. **Playback Context**: Dedicated AudioContext (24kHz, isolated from microphone)
5. **Queueing**: Bulletproof scheduling with `nextAudioTimeRef` (50ms buffer)
6. **Output**: AudioBufferSourceNode → destination (speakers)

#### Silent Vacuum Architecture
- **Purpose**: Keep ScriptProcessorNode firing without audio feedback
- **Implementation**: Microphone → Processor → GainNode (muted) → destination
- **Gain**: 0.0 (complete silence, prevents feedback loops)
- **Benefit**: Continuous audio processing without audible output

## Backend Architecture

### Next.js Route Handlers
```
🚀 CURRENT: /api/gemini-live (GET) - PRODUCTION
├── Request: Query parameters (none required)
├── Process: Generate WebSocket URL and setup config
├── Config: Model, voice (Puck), system instructions, generation config
└── Response: { websocketUrl, setupConfig }

🔧 Debug: /api/debug (GET) - API key status check
🔧 Debug: /api/list-models (GET) - Available AI models and Live API support
```

### Binary Tutor System
- **Tutor Selection**: Dog (Koko) or Cat (Mimi)
- **Dynamic Voice Routing**: 
  - Koko the Dog → "Puck" (Male voice)
  - Mimi the Cat → "Aoede" (Female voice)
- **Gender Adaptation**: Masculine/Feminine Hebrew grammar rules
- **Persona**: Friendly animal tutors (NEVER "Morah" or "Teacher")
- **Language**: 95% Hebrew with natural conversation flow
- **Age Adaptation**: Dynamic vocabulary adjustment based on user's stated age
- **Response Modalities**: Audio-only (native speech generation)

### Tool Functions
```javascript
award_star: Reward correct answers (increments star counter)
show_spelling: Display image + letter-by-letter spelling aid
```

## Frontend Architecture

### React Component Structure
```
🚀 CURRENT: src/app/page.tsx (Gemini Live Version - PRODUCTION)
├── KokoApp
│   ├── GenderSelection (Boy/Girl choice with hardcoded avatars)
│   │   ├── Boy: /avatars/boy_avatar.png
│   │   └── Girl: /avatars/girl_avatar.png
│   ├── ProfileSelector (Binary Tutor Selection)
│   │   ├── Koko the Dog: /avatars/cute-dog-studio.jpg
│   │   └── Mimi the Cat: /avatars/cute-cat-studio.png
│   ├── MainApp (Voice conversation interface)
│   │   ├── Avatar (Animated character)
│   │   ├── Controls (Start/Stop call)
│   │   ├── StarCounter (Gamification)
│   │   └── VisualAid (Modal for spelling help)
│   └── useGeminiAudio hook integration

🔧 Debug: src/app/test/page.tsx (API testing)
```

### State Management (Zustand)
```javascript
VoiceStore:
├── state: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'
├── userProfile: { id, name, ageGroup, avatar }
├── kidGender: 'boy' | 'girl' | null
├── starCount: number
├── visualAid: { word, imageQuery, imageUrl, isVisible } | null
├── conversationHistory: Array<{role, content, timestamp}>
└── connection: { isConnected, sessionId, error }
```

### Hook Architecture
```javascript
🚀 CURRENT: useGeminiAudio Hook (Production)
├── WebSocket connection management
├── Dynamic Voice Routing Matrix
│   ├── tutorId: 'koko' → Voice: 'Puck' (Male)
│   ├── tutorId: 'mimi' → Voice: 'Aoede' (Female)
│   └── kidGender: 'boy'/'girl' → Grammar rules
├── Microphone initialization with downsampling
├── Dedicated playback AudioContext (isolated)
├── Event-driven greeting flow (setupComplete trigger)
├── Audio processing with noise gate
├── State management integration (Zustand)
├── Tool function processing (stars, visual aids)
└── Error handling and connection recovery

Key Technical Details:
├── Downsampling: Hardware rate → 16kHz (nearest-neighbor)
├── Playback: Dedicated 24kHz AudioContext with 3x gain boost
├── Queueing: Bulletproof scheduling to prevent audio crackling
├── Silent Vacuum: Muted GainNode keeps processor active
├── Live State Ref: Avoids stale closure in onaudioprocess
└── Dynamic systemInstruction: Tutor persona + grammar + age adaptation
```

## Data Flow

### 🚀 Gemini Live Session Flow (Current)
1. **Gender Selection**: Boy or Girl (hardcoded avatar images)
2. **Tutor Selection**: Koko the Dog or Mimi the Cat (hardcoded images)
3. **Setup Request**: GET /api/gemini-live (fetch WebSocket URL + config)
4. **Dynamic Voice Matrix**: Calculate tutorName, tutorType, voiceSelection, grammarRule
5. **WebSocket Connection**: Connect to v1alpha BidiGenerateContent endpoint
6. **Setup Payload**: Send model, dynamic voice, behavioral rules, generation config
7. **Event-Driven Greeting**: Wait for `setupComplete` event, then send dynamic greeting
8. **Microphone Initialization**: getUserMedia → ScriptProcessorNode → Silent Vacuum
9. **Playback Initialization**: Dedicated AudioContext (24kHz, user gesture)
10. **Bidirectional Streaming**: Real-time audio conversation begins

### Real-time Communication Flow
```
🚀 Gemini Live (Current):

Input Path:
User Microphone (44.1kHz/48kHz) → 
ScriptProcessorNode → 
Downsampling (16kHz) → 
Noise Gate (0.005 threshold) → 
Float32 → PCM16 → Base64 → 
WebSocket realtimeInput → 
Gemini AI

Output Path:
Gemini AI → 
WebSocket serverContent → 
Base64 audio chunks → 
PCM16 → Float32 (3x gain) → 
Dedicated AudioContext (24kHz) → 
Bulletproof Queueing → 
AudioBufferSourceNode → 
Speakers

Events:
WebSocket onmessage → 
JSON parsing → 
setupComplete / modelTurn / turnComplete → 
State updates (Zustand) → 
UI reactions
```

### Tool Function Flow
```
AI Decision → show_visual_aid() → RTCDataChannel → 
Frontend Handler → setVisualAid() → VisualAid Modal → 
User Interaction → Tool Output → AI Continuation
```

## Persona & Conversation Logic

### Binary Tutor Personas

**Koko the Dog (Male Voice - Puck):**
- **Identity**: Highly energetic, friendly dog AI tutor
- **Persona Rule**: NEVER call yourself "Morah" or "Teacher"
- **Language Mix**: 95% Hebrew, 5% English (teaching moments)
- **Tone**: Encouraging, playful, never condescending

**Mimi the Cat (Female Voice - Aoede):**
- **Identity**: Highly energetic, friendly cat AI tutor
- **Persona Rule**: NEVER call yourself "Morah" or "Teacher"
- **Language Mix**: 95% Hebrew, 5% English (teaching moments)
- **Tone**: Encouraging, playful, never condescending

### Behavioral Rules (Injected via systemInstruction)
1. **Identity**: Maintain animal persona (dog/cat), never use "Morah"
2. **Grammar**: Strictly correct masculine/feminine Hebrew based on kidGender
3. **Language**: 95% Hebrew, 5% English for organic teaching
4. **Conversation**: VERY short responses (1-2 sentences), always end with question
5. **Age Adaptation**: Ask user's age, then adapt vocabulary (simple for kids, sophisticated for adults)
6. **Kill Switch**: Respond to goodbye phrases ("Bye", "להתראות") with warm farewell

### Hebrew Grammar Rules
- **Gender Grammar**: Masculine ("Ata", "Rotze") vs Feminine ("At", "Rotza")

### Anti-Repetition Protocols
- **Varied Topics**: Animals → food → toys → school → hobbies
- **Flexible Praise**: "Kol hakavod!", "Aluf!", "Eizeh yofi!"
- **Context Switching**: Follow child's subject changes naturally

## Technical Specifications

### Performance Requirements
- **Latency**: <500ms audio round-trip (WebSocket streaming)
- **Sample Rate Mismatch**: Handled via downsampling (hardware → 16kHz)
- **Noise Gate**: 0.005 energy threshold to filter silence
- **Audio Queueing**: 50ms buffer between chunks to prevent crackling
- **Turn Length**: 1-2 sentences max, then wait for child
- **Image Load**: <3 seconds for visual aids

### Audio Processing Details
- **Input Buffer**: 4096 samples per ScriptProcessorNode callback
- **Downsampling Ratio**: Calculated dynamically (inputRate / 16000)
- **Playback Gain**: 3x amplification for audibility
- **Context Isolation**: Separate AudioContext for playback (prevents feedback)
- **State Management**: liveStateRef to avoid stale closures

### Error Handling
- **No Silent Failures**: All errors logged and displayed
- **Graceful Degradation**: Fallback to placeholder images
- **Connection Recovery**: Auto-reconnect on WebRTC failure
- **State Consistency**: Zustand persist across sessions

### Security & Privacy
- **Ephemeral Tokens**: No persistent API keys in frontend
- **No Audio Storage**: Real-time processing only
- **Child Safety**: No external links or unvetted content

## Development Protocols

### No Silent Failures
- All errors must surface to user with friendly messaging
- Network issues show "Connection problem, trying again..."
- Audio permissions request with clear instructions
- Tool failures trigger fallback behaviors

### No Hardcoded Flashcards
- Dynamic conversation generation based on child's responses
- Contextual English word integration
- Spontaneous topic selection
- Responsive to child's mood and interests

### Gender-Aware Hebrew
- Masculine grammar for boys: "Ata yachol", "Ata chamud"
- Feminine grammar for girls: "At yechola", "At chamuda"  
- Grammar rules injected at top of AI instructions
- Consistent usage throughout conversation

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Audio**: Web Audio API (ScriptProcessorNode, AudioContext, AudioBufferSourceNode)
- **WebSocket**: Native browser WebSocket API

### Backend
- **Runtime**: Next.js Edge Runtime
- **🚀 Primary API**: Google Gemini 2.5 Flash Native Audio (Live API)
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Protocol**: WebSocket (v1alpha BidiGenerateContent)
- **Database**: None (stateless currently)
- **Authentication**: Google AI API Key (query parameter)

### Infrastructure
- **Deployment**: Vercel (Edge functions)
- **CDN**: Vercel's global network
- **🚀 Recommended**: Google Cloud Run for cost optimization
- **Monitoring**: Console logging + error tracking
- **Environment**: NEXT_PUBLIC_* for client keys

### Cost Analysis
```
🚀 Gemini Live API: Cost-effective
- API: Google Gemini 2.5 Flash Native Audio
- Pricing: Per-token + audio streaming (significantly lower than OpenAI)
- Hosting: Vercel free tier
- WebSocket: No additional infrastructure cost
- Total: Affordable for production use
```

## Current Limitations

### Session Persistence
- No database storage of learned words
- No progress tracking across sessions
- No parent dashboard access

### Visual Content
- Limited to Unsplash/Picsum image APIs
- No custom illustration library
- No animation library for character

### Multi-user Support
- Single child per session
- No sibling profiles
- No classroom management

## Future Architecture Considerations

### Database Integration (Phase 4)
- Supabase/PostgreSQL for session history
- Word mastery tracking
- Progress analytics

### Parent Dashboard (Phase 5)
- Session summaries
- Learning progress reports
- Configuration management

### Enhanced Visuals
- Custom avatar animations
- Interactive learning games
- Progress visualization charts
