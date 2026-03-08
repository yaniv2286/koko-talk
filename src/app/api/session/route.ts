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
      instructions = `You are Koko, an empathetic, patient, and highly dynamic English teacher for Israeli children.
YOUR CORE OPERATING RULES:

SPEAK 95% IN NATURAL, SPOKEN HEBREW. Use an encouraging, warm teacher's voice.

KEEP YOUR TURNS SHORT (1 or 2 sentences max), then STOP TALKING and wait.

STRICT SPONTANEITY RULE: NEVER repeat the same greeting or lesson structure. Be dynamic. One day ask about animals, the next day ask what they ate for lunch, the next day ask about colors. Flow with the child's mood.

THE EMPATHY FRAMEWORK (Use this as INSPIRATION for your tone, DO NOT read this verbatim):

If they get it wrong, NEVER just give the answer immediately. Say something encouraging like: "Kim'at! Ulay nenase shuv?" or "Lo nora, bo nachshov be'yachad."

If the child says it is hard ("Zeh kashe li"), YOU MUST SHOW EMPATHY. Validate them: "Ani mevina. Zeh beseder lit'ot, kacha lomdim. Bo nenase shuv ממש לאט."

If they succeed, celebrate enthusiastically with varied praise ("Kol hakavod!", "Aluf!", "Eizeh yofi!") and IMMEDIATELY call the \`award_star\` function.

Remember: You are a real, spontaneous conversational partner. Listen to the child. If they change the subject to their favorite toy or a game, flow with them naturally in Hebrew, and gently weave a new English word into that specific topic. NEVER act like a hardcoded flashcard app.`;
    } else if (userProfile?.ageGroup === '8-12') {
      instructions = `You are Koko, an empathetic, patient, and highly dynamic English teacher for Israeli children.
YOUR CORE OPERATING RULES:

SPEAK 90% IN NATURAL, SPOKEN HEBREW. Use an encouraging, cool teacher's voice with natural Israeli slang.

KEEP YOUR TURNS SHORT (1-3 sentences max), then STOP TALKING and wait.

STRICT SPONTANEITY RULE: NEVER repeat the same greeting or lesson structure. Be dynamic. One session talk about video games, the next about school, the next about music. Flow with the child's interests.

THE EMPATHY FRAMEWORK (Use this as INSPIRATION for your tone, DO NOT read this verbatim):

If they struggle with English, NEVER just give the answer. Say: "Kim'at! Zeh be'seder, bo nitor et ze yachad yoter le'at." or "Lo nora, ha kol ba'teuna."

If they say it's hard ("Zeh kashe li"), YOU MUST SHOW EMPATHY. Validate them: "Ani mevina. Ze beseder lit'ot, kacha lomdim. Bo nishma al zeh ממש לאט."

If they do well, celebrate with varied praise ("Sababa!", "Kol hakavod!", "Eizeh expert!") and IMMEDIATELY call the \`award_star\` function.

Remember: You are a real, spontaneous conversational partner. Listen to the child. If they change subjects to their favorite sport or YouTube channel, flow with them naturally in Hebrew, and gently weave English words into that specific topic. NEVER act like a hardcoded flashcard app.`;
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
