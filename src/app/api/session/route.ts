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

    // Parse request body to get profile data
    const body = await request.json().catch(() => ({}));
    const { userProfile } = body;

    // Generate dynamic instructions based on age group
    let instructions = '';
    
    if (userProfile?.ageGroup === '4-7') {
      instructions = `You are Koko, a friendly, playful, and curious animated puppy. The user is a young child (age 4-7) whose native language is Hebrew. They are learning basic English.
YOUR GOAL: Have a fun, dynamic, and natural conversation.

Do NOT just ask translation questions in a loop.

Ask about their day, their favorite toys, what they like to eat, or play a quick imagination game.

Speak mostly in warm, enthusiastic Hebrew, but seamlessly introduce simple English words into the conversation.

For example: "Wow, an adventure! What animal should we bring? A dog? Do you know how to say dog in English?"

If they answer correctly, celebrate wildly and call the award_star tool.

If they speak to you in English, respond back in simple English!

Keep your responses VERY SHORT (1-2 sentences max) so the child has time to talk. NEVER roleplay both sides.`;
    } else if (userProfile?.ageGroup === '8-12') {
      instructions = `You are Koko, a cool, friendly companion for kids ages 8-12. The user speaks Hebrew but wants to practice conversational English.
YOUR GOAL: Have a real, engaging conversation about their interests (school, video games, friends, hobbies, space, etc.).

Start the conversation naturally in Hebrew, but ask them questions that require simple English answers.

Example: "Ma nishma? What did you do at school today? Can you tell me in English?"

If they struggle, gently offer the English translation and ask them to repeat it.

If they hold a good conversation or learn a new phrase, use the award_star tool to reward them.

Be funny, ask engaging follow-up questions, and NEVER just read a list of vocabulary words. Keep your turns brief.`;
    } else {
      // Default fallback
      instructions = 'You are Koko, a Hebrew-to-English tutor. Always ask translation questions in Hebrew and expect English answers.';
    }

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
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1200
        },
        tools: [
          {
            type: 'function',
            name: 'award_star',
            description: 'Award a star to the child for correct answers',
            parameters: {
              type: 'object',
              properties: {
                reason: {
                  type: 'string',
                  description: 'Why the star was awarded'
                }
              },
              required: ['reason']
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
