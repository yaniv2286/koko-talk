# קוקו (Koko) - AI English Tutor for Israeli Children

🚀 **AI-powered English tutoring platform** featuring real-time voice conversation with visual learning aids and gamification.

## 🌟 Major Achievement: Gemini Live API with Native Audio!

**✅ MIGRATION COMPLETE**: Switched from expensive OpenAI to affordable Google Gemini Live API with native audio streaming.

```
Before: $60-100/month (OpenAI Realtime)
After:  Cost-effective (Gemini Live API)
Features: Native audio streaming, real-time voice conversation! 🎉
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
- **🎤 Real-time Voice**: Native audio streaming via WebSocket
- **🗣️ Hebrew Native**: Perfect gender-aware Hebrew voice responses
- **👧👦 Gender Smart**: Masculine/feminine grammar adaptation
- **⭐ Gamification**: Star rewards for confidence building
- **🎨 Visual Aids**: Spelling assistance with images
- **📱 Modern UI**: Clean, responsive interface
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
└── Cost: Cost-effective streaming
```

### Frontend
```
🚀 KokoApp (Main Route)
├── Real-time voice conversation
├── WebSocket bidirectional streaming
├── Downsampling: Hardware rate → 16kHz
├── Dedicated playback: 24kHz AudioContext with 3x gain
├── Star system and visual aids
├── Modern responsive design
└── useGeminiAudio hook
```

### Audio Pipeline
```
Input:  Microphone → Downsampling → Noise Gate → WebSocket
Output: WebSocket → Decode → 3x Gain → Queueing → Speakers
```

## 🎓 Educational Philosophy

### Morah Koko Persona
- **👩‍🏫 Identity**: Warm, empathetic Israeli English teacher
- **🗣️ Language**: 95% Hebrew, natural slang integration
- **🎯 Approach**: Conversational partner, not rigid tutor
- **💝 Empathy**: Validates struggle with supportive responses

### Gender-Aware Hebrew
```hebrew
Boy:  "היי חמוד! אני קוקו! כל כך שמח ללמד אותך אנגלית היום! בן כמה אתה?"
Girl: "היי חמודה! אני קוקו! כל כך שמחה ללמד אותך אנגלית היום! בת כמה את?"
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
- **Phase 2**: Gender & Avatar Onboarding

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
Status: Production ready
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

🚀 **Ready to experience real-time AI voice tutoring?** 

**Start with**: `https://koko-talk.vercel.app`

**Questions?** Check our [Architecture Docs](./ARCHITECTURE.md) and [Roadmap](./ROADMAP.md).

---

*Last Updated: March 16, 2026*
*Status: Production Ready with Gemini Live API Native Audio*
