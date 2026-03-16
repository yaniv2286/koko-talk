# קוקו (Koko) - AI English Tutor for Israeli Children

🚀 **AI-powered English tutoring platform** featuring real-time voice conversation with visual learning aids and gamification.

## 🌟 Major Achievement: Binary Tutor System with Dynamic Voice Routing!

**✅ MIGRATION COMPLETE**: Switched from expensive OpenAI to affordable Google Gemini Live API with native audio streaming. **NEW**: Choose between Koko the Dog 🐶 or Mimi the Cat 🐱 with dynamic voice routing!

```
Before: $60-100/month (OpenAI Realtime)
After:  Cost-effective (Gemini Live API)
Features: Binary tutor selection, dynamic voices, real-time conversation! 🎉
```

## 🚀 Quick Start

### **Production Version**
```
🎯 URL: https://koko-talk.vercel.app
� Features: Real-time voice conversation, Hebrew support, gender-aware
⭐ Status: Production ready with native audio
```

### **Local Development**
```bash
# Clone and install
git clone https://github.com/yaniv2286/koko-talk.git
cd koko-talk
npm install

# Setup environment
cp .env.example .env.local
# Add your Google AI API key: GOOGLE_AI_API_KEY=your_key_here

# Run development server
npm run dev
```

**Open**: 
- **Main App**: `http://localhost:3000` (Gemini Live with voice)
- **Debug Tools**: `http://localhost:3000/test`

## 🎯 Features

### 🚀 Gemini Live API (Production)
- **� Binary Tutor System**: Choose between Koko the Dog 🐶 or Mimi the Cat 🐱
- **🎤 Dynamic Voice Routing**: Puck (Male) for Dog, Aoede (Female) for Cat
- **🗣️ Hebrew Native**: Perfect gender-aware Hebrew voice responses
- **👧👦 Gender Smart**: Masculine/feminine grammar adaptation
- **🧠 Age Adaptation**: AI asks your age and adapts vocabulary dynamically
- **⭐ Gamification**: Star rewards for confidence building
- **🎨 Visual Aids**: Spelling assistance with images
- **📱 Modern UI**: Clean, responsive interface with hardcoded assets
- **🔊 High Quality**: 16kHz input, 24kHz output with 3x gain boost
- **⚡ Low Latency**: <500ms round-trip audio streaming

## 🏗️ Architecture

### Backend
```
🚀 Production: Google Gemini Live API
├── Route: /api/gemini-live
├── Model: gemini-2.5-flash-native-audio-preview-12-2025
├── Protocol: WebSocket (v1alpha BidiGenerateContent)
├── Audio: Native PCM16 streaming (16kHz input, 24kHz output)
├── Dynamic Voice: Puck (Dog) or Aoede (Cat)
└── Cost: Cost-effective streaming
```

### Frontend
```
🚀 KokoApp (Main Route)
├── Gender Selection: Boy/Girl (hardcoded avatars)
├── Binary Tutor Selection: Dog 🐶 or Cat 🐱 (hardcoded images)
├── Real-time voice conversation
├── WebSocket bidirectional streaming
├── Downsampling: Hardware rate → 16kHz
├── Dedicated playback: 24kHz AudioContext with 3x gain
├── Star system and visual aids
├── Modern responsive design
└── useGeminiAudio hook with dynamic voice routing
```

### Audio Pipeline
```
Input:  Microphone → Downsampling → Noise Gate → WebSocket
Output: WebSocket → Decode → 3x Gain → Queueing → Speakers

Voice Matrix:
Koko the Dog → Puck (Male voice)
Mimi the Cat → Aoede (Female voice)
```

## 🎓 Educational Philosophy

### Binary Tutor Personas

**Koko the Dog 🐶 (Puck - Male Voice):**
- **Identity**: Highly energetic, friendly dog AI tutor
- **Rule**: NEVER calls itself "Morah" or "Teacher"
- **Language**: 95% Hebrew, 5% English for organic teaching
- **Approach**: Short responses (1-2 sentences), always ends with question

**Mimi the Cat 🐱 (Aoede - Female Voice):**
- **Identity**: Highly energetic, friendly cat AI tutor
- **Rule**: NEVER calls itself "Morah" or "Teacher"
- **Language**: 95% Hebrew, 5% English for organic teaching
- **Approach**: Short responses (1-2 sentences), always ends with question

### 6 Critical Behavioral Rules
1. **Identity**: Maintain animal persona (dog/cat), never use "Morah"
2. **Grammar**: Strictly correct masculine/feminine Hebrew based on gender
3. **Language**: 95% Hebrew, 5% English for teaching moments
4. **Conversation**: VERY short responses, always end with engaging question
5. **Age Adaptation**: Ask user's age, adapt vocabulary (simple for kids, sophisticated for adults)
6. **Kill Switch**: Respond to goodbye phrases with warm farewell

### Gender-Aware Hebrew
```hebrew
Boy:  "היי! אני קוקו הכלב! בן כמה אתה?"
Girl: "היי! אני מימי החתולה! בת כמה את?"
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Audio**: Web Audio API (ScriptProcessorNode, AudioContext, AudioBufferSourceNode)
- **WebSocket**: Native browser WebSocket API

### Backend
- **API**: Google Gemini 2.5 Flash Native Audio (Live API)
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Protocol**: WebSocket v1alpha BidiGenerateContent
- **Runtime**: Next.js Edge Runtime
- **Deployment**: Vercel (recommended) or Google Cloud Run

## 📊 Development Status

### ✅ Completed
- **Phase 0**: Gemini Live API Migration 🎉
- **Phase 1**: Native Audio Pipeline (WebSocket streaming)
- **Phase 2**: Binary Tutor Selection & Onboarding 🎭

### 🔄 In Progress
- **Phase 3**: Visual Scaffolding (80% complete)

### 📋 Next Steps
- Complete visual aid integration
- Optimize audio processing (AudioWorklet migration)
- Database for progress tracking

## 🔧 Environment Setup

### Required API Keys
```bash
# .env.local
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional, for legacy version
```

### Get Google AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `.env.local`
4. Restart development server

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Google Cloud Run (Cost Optimization)
```bash
# Build container
docker build -t koko-talk .

# Deploy to Cloud Run
gcloud run deploy koko-talk --image gcr.io/PROJECT/koko-talk
```

## 📈 Technical Highlights

### Binary Tutor System
```
Tutor Selection:
- Koko the Dog 🐶: /avatars/cute-dog-studio.jpg → Puck (Male)
- Mimi the Cat 🐱: /avatars/cute-cat-studio.png → Aoede (Female)

Dynamic Matrix:
- tutorId → voiceSelection (Puck/Aoede)
- kidGender → grammarRule (masculine/feminine)
- systemInstruction → 6 behavioral rules injected
```

### Audio Processing
```
Input Pipeline:
- Hardware capture: 44.1kHz or 48kHz
- Downsampling: Mathematical nearest-neighbor → 16kHz
- Noise gate: 0.005 energy threshold
- Encoding: Float32 → PCM16 → Base64

Output Pipeline:
- Decoding: Base64 → PCM16 → Float32
- Gain boost: 3x amplification
- Dedicated context: 24kHz AudioContext (isolated)
- Queueing: 50ms buffer scheduling
```

### Cost Analysis
```
API: Gemini Live API (cost-effective streaming)
Hosting: Free (Vercel) or $5-10/month (Cloud Run)
Status: Production ready with Binary Tutor System
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI**: For affordable, high-quality language models
- **OpenAI**: For pioneering real-time AI conversations
- **Vercel**: For excellent hosting platform
- **Next.js**: For powerful React framework

---

🚀 **Ready to experience real-time AI voice tutoring with personalized animal tutors?** 

**Start with**: `https://koko-talk.vercel.app`

**Choose your tutor**: Koko the Dog 🐶 or Mimi the Cat 🐱

**Questions?** Check our [Architecture Docs](./ARCHITECTURE.md) and [Roadmap](./ROADMAP.md).

---

*Last Updated: March 16, 2026*
*Status: Production Ready with Binary Tutor System & Dynamic Voice Routing*
