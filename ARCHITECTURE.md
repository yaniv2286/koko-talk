# Koko Talk - Architecture Documentation

## Overview
Koko Talk is an AI-powered English tutoring application for Israeli children ages 4-12, featuring real-time conversation with visual learning aids. **NOW WITH COST-EFFECTIVE GEMINI BACKEND** - 90% cost reduction while maintaining full functionality.

## Core Engine

### 🚀 NEW: Gemini AI Backend (Primary Recommendation)
- **Implementation**: Direct REST API calls to Google AI
- **Model**: `gemini-2.5-flash` (latest available)
- **Cost**: $5-15/month (vs $60-100/month with OpenAI)
- **Connection**: HTTP-based with instant responses
- **Authentication**: Google AI API Key
- **Route**: `/api/gemini-direct`

### 🔄 Legacy: OpenAI Realtime API via WebRTC (Deprecated)
- **Implementation**: Native WebRTC P2P connection (abandoned WebSockets for latency)
- **Model**: `gpt-4o-realtime-preview-2024-12-17`
- **Audio**: PCM16, 24kHz, bi-directional streaming
- **Connection**: RTCPeerConnection with RTCDataChannel for JSON events
- **Authentication**: Ephemeral tokens via `/api/session` endpoint
- **Status**: High cost, quota issues - use Gemini instead

### Audio Pipeline
- **Gemini Version**: Text-based chat (TTS coming in Phase 2)
- **OpenAI Version**: MediaStream getUserMedia() → RTCPeerConnection addTrack()
- **Output**: RTCPeerConnection ontrack() → HTMLAudioElement autoplay
- **Monitoring**: AudioContext AnalyserNode for VU meter visualization
- **VAD**: Server-side Voice Activity Detection (1200ms silence threshold)

## Backend Architecture

### Next.js Route Handlers
```
🚀 NEW: /api/gemini-direct (POST) - RECOMMENDED
├── Request: { userProfile, kidGender, message }
├── Process: Direct Google AI API call with Hebrew instructions
├── Action: Generate Hebrew response with gender awareness
└── Response: { response, model, timestamp }

🔄 Legacy: /api/session (POST) - DEPRECATED
├── Request: { userProfile, kidGender }
├── Process: Generate dynamic instructions + gender rules
├── Action: Create OpenAI ephemeral session
└── Response: { ephemeralToken, model, voice }

🔧 Debug: /api/debug (GET) - API key status check
🔧 Debug: /api/list-models (GET) - Available AI models
```

### Dynamic Instruction Generation
- **Age Groups**: 4-7 (playful), 8-12 (cool companion)
- **Gender Adaptation**: Masculine/Feminine Hebrew grammar rules
- **Persona**: Empathetic Israeli English Teacher ("Morah Koko")
- **Language**: 95% Hebrew with natural slang ("Yalla", "Sababa", "Eize kef")

### Tool Functions
```javascript
award_star: Reward correct answers
show_visual_aid: Display image + letter-by-letter spelling
```

## Frontend Architecture

### React Component Structure
```
🚀 NEW: src/app/gemini/page.tsx (Gemini Version - RECOMMENDED)
├── GeminiKokoApp
│   ├── Text-based chat interface
│   ├── Star counter and visual aids
│   ├── Modern responsive UI
│   └── Cost-effective backend integration

🔄 Legacy: src/app/page.tsx (OpenAI Version - DEPRECATED)
├── ProfileSelector (Age/Avatar/Gender onboarding)
├── GenderSelection (Boy/Girl choice)
├── MainApp
│   ├── Avatar (Animated character)
│   ├── Controls (Connect/Disconnect)
│   ├── StarCounter (Gamification)
│   └── VisualAid (Modal for spelling help)

🔧 Debug: src/app/test/page.tsx (Simple API testing)
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
🚀 NEW: useGeminiAudio Hook (Recommended)
├── Direct HTTP API calls to Gemini
├── Text-based conversation handling
├── State management integration
└── Error handling and debugging

🔄 Legacy: useRealtimeAudio Hook (Deprecated)
├── RTCPeerConnection setup
├── MediaStream acquisition
├── RTCDataChannel event handling
├── Audio level monitoring
└── Tool function processing
```

## Data Flow

### 🚀 Gemini Session Flow (Recommended)
1. **User Selection**: Navigate to `/gemini` route
2. **API Request**: POST /api/gemini-direct with profile data
3. **Dynamic Instructions**: Gender-aware Hebrew grammar + age-appropriate persona
4. **Direct Response**: Google AI generates Hebrew text response
5. **UI Update**: Text displayed in chat interface

### 🔄 Legacy OpenAI Session Flow (Deprecated)
1. **User Selection**: Age → Avatar → Gender
2. **Token Request**: POST /api/session with profile data
3. **Dynamic Instructions**: Gender-aware Hebrew grammar + age-appropriate persona
4. **Ephemeral Session**: OpenAI creates WebRTC session
5. **P2P Connection**: RTCPeerConnection offer/answer exchange

### Real-time Communication
```
🚀 Gemini Version:
User Text → HTTP API → Google AI → Hebrew Response → UI Display

🔄 OpenAI Version:
User Microphone → RTCPeerConnection → OpenAI
OpenAI Response → RTCPeerConnection → User Speakers
RTCDataChannel Events → Frontend State Updates
```

### Tool Function Flow
```
AI Decision → show_visual_aid() → RTCDataChannel → 
Frontend Handler → setVisualAid() → VisualAid Modal → 
User Interaction → Tool Output → AI Continuation
```

## Persona & Conversation Logic

### Morah Koko Character
- **Identity**: Empathetic Israeli English teacher
- **Language**: 95% Hebrew, 5% English integration
- **Tone**: Warm, encouraging, uses natural Israeli slang
- **Approach**: Conversational partner, not rigid flashcard machine

### Dynamic Conversation Rules
- **Spontaneity**: Never repeat same greeting/lesson structure
- **Empathy**: Validate struggle ("Zeh kashe li") with supportive responses
- **Adaptation**: Flow with child's interests and mood changes
- **Gender Grammar**: Masculine ("Ata", "Rotze") vs Feminine ("At", "Rotza")

### Anti-Repetition Protocols
- **Varied Topics**: Animals → food → toys → school → hobbies
- **Flexible Praise**: "Kol hakavod!", "Aluf!", "Eizeh yofi!"
- **Context Switching**: Follow child's subject changes naturally

## Technical Specifications

### Performance Requirements
- **Latency**: <200ms audio round-trip (WebRTC advantage)
- **VAD Threshold**: 1200ms silence for children's processing time
- **Turn Length**: 1-2 sentences max, then wait for child
- **Image Load**: <3 seconds for visual aids

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
- **Audio**: Web Audio API + WebRTC (Legacy) / Text-based (Gemini)

### Backend
- **Runtime**: Next.js Edge Runtime
- **🚀 Primary API**: Google Gemini 2.5 Flash
- **🔄 Legacy API**: OpenAI Realtime API (Deprecated)
- **Database**: None (stateless currently)
- **Authentication**: API Keys (Google AI) / Ephemeral tokens (OpenAI)

### Infrastructure
- **Deployment**: Vercel (Edge functions)
- **CDN**: Vercel's global network
- **🚀 Recommended**: Google Cloud Run for cost optimization
- **Monitoring**: Console logging + error tracking
- **Environment**: NEXT_PUBLIC_* for client keys

### Cost Comparison
```
🚀 Gemini Version: $5-15/month
- API: Google Gemini 2.5 Flash
- Hosting: Vercel free tier
- Total: 90% cost reduction

🔄 OpenAI Version: $60-100/month
- API: OpenAI Realtime
- Hosting: Vercel
- Issues: Quota limitations, high cost
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
