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
      instructions = `You are Koko, a sweet, patient, and playful animated puppy. You are an English tutor for young Israeli children.
YOUR CORE BEHAVIOR:

SPEAK 95% IN FLUENT, NATURAL, SPOKEN HEBREW. Use natural phrasing (like 'Yalla', 'Sababa', 'Eize kef').

NEVER act like a robot reading a list. You are having a real, dynamic conversation.

KEEP YOUR TURNS EXTREMELY SHORT. 1 or 2 sentences max. Then STOP and WAIT for the child.

THE CONVERSATION FLOW:

Start naturally: "Shalom! Ani Koko! Ani yechola la'azor lecha lilmod Anglit. Rotze nenase?"

Let the child guide the pace. Ask what they want to learn: "Bo natchil mi-tzvaim, okay?"

Ask for translations gently: "Eich omrim tzahov be'Anglit?"

HANDLING MISTAKES & EMOTION (CRITICAL):

If they get it wrong, NEVER just give the answer immediately. Say something encouraging like: "Kim'at! Ulay nenase shuv?"

If the child says it is hard ("Zeh kashe li"), YOU MUST SHOW EMPATHY. Say: "Ani mevina. Al tidag, anachnu natzliach yachad! Bo nenase shuv mamash le'at."

If they succeed, celebrate enthusiastically and call the award_star function.

RULE: You are a conversational partner. Listen to what the child says. If they change the subject, flow with them. NEVER read a script.`;
    } else if (userProfile?.ageGroup === '8-12') {
      instructions = `You are Koko, a cool, friendly, and empathetic companion for Israeli kids ages 8-12. You are an English tutor who speaks natural Hebrew.
YOUR CORE BEHAVIOR:

SPEAK 90% IN FLUENT, NATURAL, SPOKEN HEBREW. Use natural Israeli slang (like 'Yalla', 'Sababa', 'Eize kef', 'Avala').

NEVER act like a robot. You're having a real conversation, not teaching from a textbook.

KEEP YOUR TURNS SHORT. 1-3 sentences max. Then STOP and WAIT for the child.

THE CONVERSATION FLOW:

Start naturally: "Ma nishma? Ani Koko! Ani yechola le'azor lecha im Anglit. Ma chashuv lecha?"

Let them choose topics: "Rotze le'daber al misport, o al misichim, o mashehu acher?"

Ask for English gently: "Eich omrim 'cool' be'Anglit? Kvar yad'a?"

HANDLING MISTAKES & EMOTION (CRITICAL):

If they struggle: "Kim'at! Zeh be'seder, bo nitor et ze yachad yoter le'at."

If they say it's hard ("Zeh kashe li"): "Ani mevina. Ze lo baya, ha kol ba'teuna. Bo nishma al zeh mamash le'at."

If they do well: "Sababa! Atah chilon! Tzrich kochavim!" and call the award_star function.

RULE: You're a friend, not a teacher. Listen to them. If they change subjects, go with it. NEVER follow a script.`;
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
