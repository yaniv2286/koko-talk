# Koko Talk - Phase 1 Debug Setup

## Quick Start

1. **Add your OpenAI API Key**
   ```bash
   # Edit .env.local and replace with your actual API key
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

## Testing the Voice Pipeline

### Step 1: Start Session
- Click "Start Session" to initialize audio and connect to OpenAI
- You should see the state change from `IDLE` → `CONNECTING` → `IDLE`
- Connection status should show `CONNECTED`

### Step 2: Test Recording
- Click "Start Recording" to begin capturing audio
- State should change to `LISTENING`
- Audio level meter should show real-time audio input
- Speak into your microphone

### Step 3: Stop Recording
- Click "Stop Recording" when finished speaking
- State should change to `THINKING` as OpenAI processes your input
- Then change to `SPEAKING` as the AI responds
- Finally return to `IDLE`

### Step 4: Check Conversation
- Conversation history should show your input and Koko's responses
- Each message includes timestamp and role (You/Koko)

## Expected Behavior

- **System Prompt**: Koko will respond as a friendly English tutor for kids
- **Language**: Responses only in English (user can speak Hebrew-accented English)
- **Style**: Short, encouraging sentences
- **Latency**: Target <200ms response time

## Troubleshooting

### Microphone Permission
- Browser will request microphone permission on "Start Session"
- Grant permission to enable audio recording

### Connection Errors
- Check your OpenAI API key in `.env.local`
- Ensure you have sufficient API credits
- Check browser console for detailed error messages

### Audio Issues
- Ensure microphone is working in other applications
- Try using headphones to prevent echo
- Check browser audio permissions

## Debug Information

The debug interface shows:
- **Current State**: Voice pipeline status (idle, connecting, listening, thinking, speaking, error)
- **Connection Status**: WebSocket connection to OpenAI
- **Audio Level**: Real-time microphone input visualization (0-100%)
- **Conversation History**: Full transcript of the session
- **Error Messages**: Any connection or processing errors

## Next Steps

Once the voice pipeline is working correctly:
1. Test latency with various inputs
2. Verify audio quality and clarity
3. Test with different accents and speech patterns
4. Move to Phase 2: Avatar & UI Foundation
