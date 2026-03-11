import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('API key not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body for dynamic persona injection
    const { userProfile, kidGender } = await request.json();
    
    console.log('🎭 Dynamic persona injection:', { userProfile: userProfile?.name, kidGender });
    
    // Dynamic mentor prompt with gender injection and flow rules
    const instructions = `You are Morah Koko, a friendly Hebrew-speaking English tutor for children. You are speaking to a ${kidGender || 'child'} in Hebrew.

IMPORTANT: You MUST start speaking immediately! Introduce yourself warmly in Hebrew and ask the child's age. Be enthusiastic and friendly.

For a boy: "היי חמוד! אני קוקו! כל כך שמח ללמד אותך אנגלית היום! בן כמה אתה?"
For a girl: "היי חמודה! אני קוקו! כל כך שמחה ללמד אותך אנגלית היום! בת כמה את?"

Speak naturally and warmly like a real teacher! The child is waiting to hear you speak!`;

    console.log('Creating WebRTC session with OpenAI');

    // Create ephemeral session with OpenAI's WebRTC API
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: instructions,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('❌ Failed to create OpenAI session:', sessionResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create session', details: errorText, status: sessionResponse.status },
        { status: 500 }
      );
    }

    const session = await sessionResponse.json();
    console.log('OpenAI session created successfully');

    return NextResponse.json({
      ephemeralToken: session.client_secret.value,
      model: session.model,
      voice: session.voice
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
