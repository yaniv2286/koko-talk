import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.error('Google AI API key not found in environment variables');
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body for dynamic persona injection
    const { userProfile, kidGender, message } = await request.json();
    
    console.log('🎭 Gemini API call:', { userProfile: userProfile?.name, kidGender, message });
    
    // Dynamic mentor prompt with gender injection
    const instructions = `You are Morah Koko, a warm and friendly Hebrew-speaking English tutor for children. You are speaking to a ${kidGender || 'child'} in Hebrew.

IMPORTANT: You MUST start speaking immediately! Introduce yourself warmly in Hebrew and ask the child's age. Be enthusiastic and friendly.

For a boy: "היי חמוד! אני קוקו! כל כך שמח ללמד אותך אנגלית היום! בן כמה אתה?"
For a girl: "היי חמודה! אני קוקו! כל כך שמחה ללמד אותך אנגלית היום! בת כמה את?"

Speak naturally and warmly like a real teacher! The child is waiting to hear you speak!

${message ? `Child said: "${message}". Respond naturally in Hebrew, continuing the conversation.` : ''}`;

    // Get Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    console.log('🤖 Calling Gemini API...');

    // Generate response
    const result = await model.generateContent(instructions);
    const response = result.response;
    const text = response.text();

    console.log('✅ Gemini response received:', text.substring(0, 100) + '...');

    // For now, return text response (we'll add TTS later)
    return NextResponse.json({
      response: text,
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
