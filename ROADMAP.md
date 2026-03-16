# Koko Talk - Development Roadmap

## Project Overview
Koko Talk is an AI-powered English tutoring platform for Israeli children (ages 4-12) featuring real-time voice conversation with visual learning aids and gamification. **🚀 NOW WITH BINARY TUTOR SYSTEM - Choose between Koko the Dog or Mimi the Cat with dynamic voice routing!**

## Phase 0: Gemini Live API Migration ✅ COMPLETE

### Objectives
- Replace expensive OpenAI Realtime API with affordable Gemini Live API
- Implement native audio streaming with WebSocket bidirectional communication
- Ensure Hebrew language support and gender awareness
- Solve sample-rate mismatch and audio playback issues

### Completed Features
- **Gemini Live Integration**: WebSocket streaming via `/api/gemini-live`
- **Native Audio**: Full-duplex PCM16 audio streaming (16kHz input, 24kHz output)
- **Binary Tutor System**: Dog (Koko) or Cat (Mimi) selection
- **Dynamic Voice Routing**: Puck (Male) for Dog, Aoede (Female) for Cat
- **Hebrew Support**: Perfect gender-aware Hebrew voice responses
- **Behavioral Rules**: Strict persona enforcement (never "Morah")
- **Age Adaptation**: Dynamic vocabulary based on user's stated age
- **Downsampling**: Mathematical downsampling to fix sample-rate mismatch
- **Dedicated Playback**: Isolated AudioContext with 3x gain boost
- **Event-Driven Flow**: setupComplete-triggered greeting for reliability
- **Hardcoded Assets**: 4 exact image paths for Gender + Tutor selection
- **Debug Tools**: API testing and model listing endpoints

### Technical Achievements
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Protocol**: WebSocket v1alpha BidiGenerateContent
- **Binary Tutor Matrix**: Dynamic voice + persona + grammar routing
- **Audio Pipeline**: ScriptProcessorNode with downsampling + dedicated playback context
- **Noise Gate**: Energy threshold (0.005) to filter silence and improve AI response time
- **Silent Vacuum**: Muted GainNode architecture to keep audio processing active
- **Bulletproof Queueing**: 50ms buffer scheduling to prevent audio crackling
- **systemInstruction**: 6 critical behavioral rules injected dynamically
- **Error Handling**: Comprehensive debugging and connection recovery

### Cost Impact
```
Before: OpenAI Realtime - $60-100/month
After:  Gemini Live API - Cost-effective streaming
Status: ✅ PRODUCTION READY WITH NATIVE AUDIO
```

---

## Phase 1: Gemini Live Audio Pipeline ✅ COMPLETE

### Objectives
- Establish low-latency real-time audio communication with Gemini Live API
- Implement WebSocket bidirectional streaming
- Solve sample-rate mismatch and audio playback issues
- Create stable connection flow with event-driven architecture

### Completed Features
- **WebSocket Connection**: Native browser WebSocket to v1alpha endpoint
- **Audio Streaming**: Bi-directional PCM16 audio (16kHz input, 24kHz output)
- **Downsampling**: Mathematical nearest-neighbor downsampling from hardware rate
- **Dedicated Playback**: Isolated AudioContext (24kHz) with 3x gain boost
- **Connection States**: Idle, connecting, listening, speaking, error handling
- **Silent Vacuum**: Muted GainNode architecture to keep processor active

### Technical Achievements
- **Latency**: <500ms round-trip audio (WebSocket streaming)
- **Sample Rate Fix**: Dynamic downsampling (44.1kHz/48kHz → 16kHz)
- **Audio Quality**: Clear playback with bulletproof queueing (50ms buffer)
- **Noise Gate**: 0.005 energy threshold to filter silence
- **Event-Driven**: setupComplete-triggered greeting prevents race conditions
- **Error Handling**: Graceful degradation and connection recovery

### Lessons Learned
- Browser ignores AudioContext sample rate request, requires manual downsampling
- Dedicated playback context prevents feedback loops and muting issues
- 3x gain boost necessary for audible playback
- liveStateRef prevents stale closure issues in onaudioprocess
- Event-driven greeting more reliable than setTimeout

### Current Status
- **✅ Functionality**: Fully working with native audio
- **✅ Economics**: Cost-effective for production use
- **✅ Recommendation**: Production ready

---

## Phase 2: Binary Tutor Selection & Onboarding ✅ COMPLETE

### Objectives
- Create personalized onboarding experience
- Implement gender-aware Hebrew grammar
- Add binary tutor selection (Dog vs Cat)
- Implement dynamic voice routing based on tutor choice

### Completed Features
- **Gender Selection**: Boy/Girl choice with Hebrew grammar adaptation
- **Binary Tutor Selection**: Koko the Dog 🐶 or Mimi the Cat 🐱
- **Hardcoded Assets**: 4 exact image paths (boy, girl, dog, cat)
- **Progressive Onboarding**: Gender → Tutor → Main App
- **Dynamic Voice Routing**: Puck (Male) for Dog, Aoede (Female) for Cat

### Technical Achievements
- **Gender-Aware AI**: Masculine ("Ata", "Rotze") vs Feminine ("At", "Rotza") grammar
- **Binary Tutor System**: Dog/Cat selection with dynamic voice matrix
- **State Management**: Zustand store with persistence for user profiles
- **UI/UX**: Large gradient buttons with hardcoded tutor images
- **Persona Logic**: Dynamic systemInstruction with 6 behavioral rules
- **Age Adaptation**: AI asks user's age and adapts vocabulary dynamically

### Lessons Learned
- Binary choice (Dog vs Cat) reduces decision paralysis
- Dynamic voice routing (Male/Female) enhances persona authenticity
- Gender-aware Hebrew significantly improves conversation naturalness
- Hardcoded assets eliminate dynamic fetching complexity
- Age adaptation allows single app to serve kids and adults
- Strict behavioral rules prevent AI from breaking character

---

## Phase 3: Visual Scaffolding (Show & Spell) 🔄 ACTIVE

### Objectives
- Add visual learning aids for struggling children
- Implement interactive spelling practice
- Enhance multi-modal learning experience

### Current Status: **IN DEVELOPMENT**

### Completed Features
- **Tool Integration**: `show_visual_aid` function in OpenAI session
- **VisualAid Component**: Modal with image display and letter slots
- **Image Fetching**: Unsplash API with Picsum fallback
- **Letter Animation**: Progressive reveal with interactive controls
- **State Management**: Visual aid state in Zustand store

### In Progress
- **AI Trigger Logic**: When to offer visual aids based on struggle detection
- **Integration Testing**: End-to-end visual aid flow
- **UI Polish**: Animations and transitions for letter revealing
- **Error Handling**: Fallback behaviors for image loading failures

### Remaining Tasks
- [ ] Implement struggle detection algorithm
- [ ] Add visual aid trigger to AI instructions
- [ ] Test complete flow: struggle → offer → display → spelling
- [ ] Optimize image loading and caching
- [ ] Add audio narration for letter sounds

### Technical Challenges
- **Image API Limits**: Unsplash rate limiting and content filtering
- **Timing Coordination**: Sync between AI speech and visual display
- **Responsive Design**: Visual aids on mobile devices
- **Performance**: Image loading without blocking conversation

---

## Phase 4: Session History & Word Mastery 📋 PENDING

### Objectives
- Track learned words across sessions
- Build persistent learning profiles
- Enable spaced repetition and mastery tracking

### Planned Features
- **Database Integration**: Supabase/PostgreSQL for session storage
- **Word Tracking**: First exposure, attempts, mastery status
- **Session History**: Conversation logs with timestamps
- **Progress Metrics**: Words learned per session, accuracy rates
- **Spaced Repetition**: AI prioritizes words needing review

### Technical Architecture
```sql
-- Proposed Schema
users (id, name, age_group, gender, avatar, created_at)
sessions (id, user_id, start_time, end_time, word_count, stars_earned)
words (id, english, hebrew, category, difficulty)
user_words (user_id, word_id, first_seen, mastery_level, attempt_count)
session_words (session_id, word_id, success_count, struggle_count)
```

### Implementation Plan
1. **Database Setup**: Supabase project with Row Level Security
2. **API Endpoints**: `/api/history`, `/api/words`, `/api/progress`
3. **Frontend Integration**: Progress tracking components
4. **AI Integration**: Personalized word selection based on history
5. **Analytics**: Learning progress visualization

### Success Metrics
- **Retention**: 80% of learned words retained after 1 week
- **Mastery**: 60% of words achieve mastery level
- **Engagement**: Increased session duration with personalized content

---

## Phase 5: Parent Dashboard & Analytics 📊 PENDING

### Objectives
- Provide visibility into child's learning progress
- Enable parental involvement and configuration
- Support multiple children per family

### Planned Features
- **Family Management**: Parent account with multiple child profiles
- **Progress Dashboard**: Session summaries, word mastery, learning trends
- **Configuration**: Session scheduling, difficulty settings, content preferences
- **Reports**: Weekly/monthly progress reports with learning insights
- **Goals & Rewards**: Customizable learning objectives and celebration settings

### Technical Architecture
```typescript
// Proposed Components
ParentDashboard:
├── ChildSelector (switch between kids)
├── ProgressOverview (charts and metrics)
├── SessionHistory (detailed conversation logs)
├── WordMastery (learned words with practice recommendations)
├── Settings (schedule, preferences, goals)
└── Reports (exportable progress reports)
```

### Implementation Plan
1. **Authentication**: Parent account system with secure child access
2. **Data Visualization**: Charts for progress trends and word mastery
3. **Export Features**: PDF reports for sharing with educators
4. **Mobile Responsive**: Dashboard accessible on phones/tablets
5. **Email Notifications**: Weekly progress summaries

### Privacy & Safety Considerations
- **COPPA Compliance**: Parental consent for data collection
- **Data Minimization**: Only store essential learning data
- **Secure Access**: Parent authentication required for dashboard
- **Data Retention**: Configurable data retention policies

---

## Future Phases (Beyond Current Roadmap)

### Phase 6: Multi-Modal Learning Games
- Interactive vocabulary games
- Pronunciation practice with speech recognition
- Story creation with AI assistance
- Cultural exchange with other learners

### Phase 7: Classroom & School Integration
- Teacher dashboard for multiple students
- Curriculum alignment with Israeli standards
- Classroom management tools
- Progress reporting for educators

### Phase 8: Advanced AI Features
- Personalized learning paths based on performance
- Emotion recognition for adaptive difficulty
- Multilingual support (Arabic, French, etc.)
- Voice cloning for familiar characters

---

## Development Principles

### Core Values
1. **Child Safety First**: All features prioritize child privacy and safety
2. **No Silent Failures**: Every error is visible and recoverable
3. **Natural Conversation**: Avoid robotic, scripted interactions
4. **Inclusive Design**: Support for different learning styles and needs
5. **Parent Partnership**: Tools for parents to support learning

### Technical Standards
- **Performance**: <200ms audio latency, <3s image loads
- **Reliability**: 99.9% uptime, graceful error handling
- **Security**: Zero-knowledge architecture, minimal data collection
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support
- **Privacy**: GDPR and COPPA compliant data practices

### Development Workflow
- **Incremental Delivery**: Each phase delivers value independently
- **User Testing**: Continuous feedback from children and parents
- **Data-Driven**: Decisions based on usage metrics and learning outcomes
- **Iterative**: Rapid prototyping and refinement based on real usage

---

### Current Status Summary

### Completed ✅
- **Phase 0**: Gemini Live API Migration 🚀 **MAJOR MILESTONE**
- **Phase 1**: Gemini Live Audio Pipeline (Native audio streaming)
- **Phase 2**: Binary Tutor Selection & Onboarding 🎭 **NEW MILESTONE**

### In Progress 🔄
- Phase 3: Visual Scaffolding (80% complete)

### Next Steps 📋
- **🎯 IMMEDIATE**: Complete Phase 3 visual aid integration
- Optimize audio processing (consider AudioWorklet migration)
- Add conversation history and word tracking (Phase 4)
- Begin parent dashboard design (Phase 5)

### Production Status
```
🚀 PRODUCTION: Gemini Live API (main route)
- Protocol: WebSocket bidirectional streaming
- Audio: Native PCM16 (16kHz input, 24kHz output)
- Features: Full Hebrew voice, gender awareness, real-time conversation
- Status: Production ready with native audio
- URL: https://koko-talk.vercel.app
```

### Timeline Estimate
- **Phase 3 Completion**: 2-3 weeks
- **Phase 4 Implementation**: 3-4 weeks
- **Phase 5 Development**: 4-6 weeks
- **Total to Full Platform**: 9-13 weeks

### Technical Summary
```
✅ Achievement: Binary Tutor System with Dynamic Voice Routing
🎭 Tutors: Koko the Dog (Puck) + Mimi the Cat (Aoede)
🎯 Status: Production ready with personalized voice conversation
🚀 Next: Complete visual aids and add progress tracking
```

---

*Last Updated: March 16, 2026*
*Major Milestone: Binary Tutor System with Dynamic Voice Routing Complete*
*Next Review: Visual Aid Integration & Progress Tracking*
