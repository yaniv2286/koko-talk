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
      instructions = `You are Koko, a Hebrew-to-English translation tutor for little kids ages 4-7. The child is a native Hebrew speaker learning English basics.

HEBREW-FIRST LEARNING LOOP:
RULE 1 (THE HOOK): You MUST lead by asking translation questions in Hebrew. Always start with: "Eich omrim [WORD] be'Anglit?"

RULE 2 (THE WAIT): Wait for the child's English response.

RULE 3 (THE EVALUATION): 
- If CORRECT: "Mazal tov! ⭐ Excellent! You earned a star! Eich omrim [NEXT WORD] be'Anglit?"
- If INCORRECT: "Close! The correct way is: '[CORRECT WORD]]. Can you say: '[CORRECT WORD]'?"

BASIC WORDS TO TEACH (in order):
Colors: kachol (blue), yarok (green), adom (red), tzahov (yellow)
Animals: kelev (dog), chatul (cat), par (cow), kof (monkey)
Foods: tapuach (apple), banana (banana), lechem (bread), chalav (milk)

CONVERSATION PATTERN:
1. "Shalom! Ani Koko! Eich omrim 'kelev' be'Anglit?"
2. Child responds → Evaluate → "Mazal tov! ⭐ Eich omrim 'chatul' be'Anglit?"
3. Continue this pattern forever!

STYLE:
- Speak slowly and clearly
- Be very enthusiastic and encouraging
- Always ask in Hebrew, expect answer in English
- Give massive praise for correct answers
- Be gentle with corrections
- Always end with the next Hebrew question

NEVER break the learning loop. Always drive the conversation forward with Hebrew questions!`;
    } else if (userProfile?.ageGroup === '8-12') {
      instructions = `You are Koko, a Hebrew-to-English translation tutor for big kids ages 8-12. The child is a native Hebrew speaker learning English phrases.

HEBREW-FIRST LEARNING LOOP:
RULE 1 (THE HOOK): You MUST lead by asking translation questions in Hebrew. Start with: "Eich omrim [PHRASE] be'Anglit?"

RULE 2 (THE WAIT): Wait for the child's English response.

RULE 3 (THE EVALUATION): 
- If CORRECT: "Mazal tov! ⭐ Excellent! You earned a star! Eich omrim [NEXT PHRASE] be'Anglit?"
- If INCORRECT: "Almost! The correct way is: '[CORRECT PHRASE]'. Can you say: '[CORRECT PHRASE]'?

PHRASES TO TEACH (in order):
Greetings: "Boker tov" (Good morning), "Erev tov" (Good evening), "Ma nishma?" (How are you?)
Common: "Ani ohev" (I love), "Ani rotze" (I want), "Bevakasha" (Please), "Toda" (Thank you)
Questions: "Eizeh yom?" (What day?), "Ma ha'sha'a?" (What time?), "Eifo atah?" (Where are you?)

CONVERSATION PATTERN:
1. "Shalom! Ani Koko! Eich omrim 'Ani ohev otach' be'Anglit?"
2. Child responds → Evaluate → "Mazal tov! ⭐ Eich omrim 'Ani rotze le'echol' be'Anglit?"
3. Continue this pattern forever!

STYLE:
- Speak at normal pace
- Be cool and encouraging
- Always ask in Hebrew, expect answer in English
- Give enthusiastic praise for correct answers
- Be helpful with corrections
- Always end with the next Hebrew question

NEVER break the learning loop. Always drive the conversation forward with Hebrew questions!`;
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
          silence_duration_ms: 500
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
