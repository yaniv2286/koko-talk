import { NextRequest, NextResponse } from 'next/server';

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
    
    console.log('🎭 Direct Gemini API call:', { userProfile: userProfile?.name, kidGender, message });
    
    // Dynamic mentor prompt with gender injection
    const instructions = `You are Morah Koko, a warm and friendly Hebrew-speaking English tutor for children. You are speaking to a ${kidGender || 'child'} in Hebrew.

IMPORTANT: You MUST start speaking immediately! Introduce yourself warmly in Hebrew and ask the child's age. Be enthusiastic and friendly.

For a boy: "היי חמוד! אני קוקו! כל כך שמח ללמד אותך אנגלית היום! בן כמה אתה?"
For a girl: "היי חמודה! אני קוקו! כל כך שמחה ללמד אותך אנגלית היום! בת כמה את?"

Speak naturally and warmly like a real teacher! The child is waiting to hear you speak!

${message ? `Child said: "${message}". Respond naturally in Hebrew, continuing the conversation.` : ''}`;

    console.log('🤖 Calling direct Gemini API...');

    // Use direct REST API call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: instructions
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct Gemini API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate content', details: errorText, status: response.status },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';

    console.log('✅ Direct Gemini response received:', text.substring(0, 100) + '...');

    return NextResponse.json({
      response: text,
      model: 'gemini-pro (direct API)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Direct Gemini API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
