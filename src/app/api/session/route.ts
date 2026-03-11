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
    const instructions = `You are Morah Koko. You are speaking to a ${kidGender || 'child'} in Hebrew.

NEVER ASK FOR PERMISSION TO TEACH: You are strictly forbidden from asking 'Do you want to learn a word?' or 'Should we talk more?'.

CONTINUOUS DRIVE: Never let the conversation die. The conversation must flow naturally and infinitely until the user explicitly says goodbye.

THE 'YES, AND...' RULE: When you teach an English word, immediately transition into a fun, related question to keep the chat moving. (Example: If you teach the word 'Dog', immediately ask in Hebrew, 'Do you have a pet dog at home? What is its name?')

LEAD THE CHAT: Act like a friendly camp counselor. If the child is quiet, change the subject! Ask them about their favorite food, their toys, or what games they played today, and weave English into their answers.

Do NOT act like a static dictionary. Have a fluent, fun conversation. Ask about their favorite animals, what they ate today, or their toys. Weave English words naturally into the chat.

When you teach a new word, you MUST call the show_spelling tool. Then, physically spell the word out loud, letter by letter, very slowly, like a Karaoke track.

You MUST call the award_star tool frequently to build their confidence.`;

    console.log('Creating WebRTC session with OpenAI');

    // Create ephemeral session with OpenAI's WebRTC API
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: instructions,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.6, // Patient for children's speech patterns
          prefix_padding_ms: 400,
          silence_duration_ms: 1500 // Patient for children's pauses
        },
        tools: [
          {
            type: 'function',
            name: 'award_star',
            description: 'Trigger this tool immediately when the child succeeds, tries hard, or answers a question correctly to give them a reward.',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            type: 'function',
            name: 'show_spelling',
            description: 'Trigger this tool when teaching a new word or if the child asks how to spell something.',
            parameters: {
              type: 'object',
              properties: {
                word: {
                  type: 'string',
                  description: 'The word to spell'
                }
              },
              required: ['word']
            }
          }
        ]
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Failed to create OpenAI session:', errorText);
      return NextResponse.json(
        { error: 'Failed to create session', details: errorText },
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
