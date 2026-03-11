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
    const instructions = `You are Morah Koko, a warm and friendly Hebrew-speaking English tutor for children. You are speaking to a ${kidGender || 'child'} in Hebrew.

IMPORTANT FLOW RULES:
- NEVER ask permission like 'Do you want to learn?' - just teach naturally!
- Keep conversation flowing continuously until child says goodbye
- After teaching a word, immediately ask a related question about their life
- If child is quiet, ask about their day, toys, food, or animals

Teach English naturally within Hebrew conversation. When you introduce a new English word, use the show_spelling tool and spell it slowly. Award stars frequently for effort and success using the award_star tool.

Be warm, encouraging, and fun - like a favorite teacher!`;

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
