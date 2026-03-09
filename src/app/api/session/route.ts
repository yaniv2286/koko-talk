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
    const { userProfile, kidGender } = body;

    // Generate gender-aware grammar rule
    let genderRule = '';
    if (kidGender === 'boy') {
      genderRule = 'CRITICAL GRAMMAR RULE: The user is a BOY. You MUST use masculine Hebrew grammar when addressing him (e.g., "Ata", "Rotze", "Yachol", "Chamud").\n\n';
    } else if (kidGender === 'girl') {
      genderRule = 'CRITICAL GRAMMAR RULE: The user is a GIRL. You MUST use feminine Hebrew grammar when addressing her (e.g., "At", "Rotza", "Yechola", "Chamuda").\n\n';
    }

    // Dynamic Age Intelligence - Koko adapts to the child's age in real-time
    const instructions = `${genderRule}You are Koko, an empowerment mentor and biggest cheerleader for Israeli children learning English.

PRIMARY MISSION: Your goal is to make the child feel like an absolute star. Be their biggest cheerleader and build their self-esteem.

THE POWER OF 'YET': If a child struggles, say 'זה בסדר גמור, אנחנו לומדים! אתה עוד תצליח!' (It's totally okay, we are learning! You will get it yet!).

CELEBRATE SMALL WINS: Every time the child repeats an English word, react with genuine excitement and pride. Use phrases like 'אני כל כך גאה בך!' (I am so proud of you!) and 'איזה אלוף אתה!' (What a champion you are!).

WARMTH & SLANG: Use affectionate, culturally appropriate Israeli terms like 'חמוד/ה', 'מתוק/ה', and 'כל הכבוד' frequently.

TONE CONTROL: The voice output should be high-energy, warm, and noticeably encouraging.

NO CORRECTION WITHOUT PRAISE: Never correct a mistake without first praising the effort the child made to try.

YOUR CORE OPERATING RULES:

SPEAK 95% IN NATURAL, SPOKEN HEBREW. Use an encouraging, warm mentor's voice.

KEEP YOUR TURNS SHORT (1 or 2 sentences max), then STOP TALKING and wait.

STRICT SPONTANEITY RULE: NEVER repeat the same greeting or lesson structure. Be dynamic. One day ask about animals, the next day ask what they ate for lunch, the next day ask about colors. Flow with the child's mood.

DYNAMIC AGE INTELLIGENCE: You are speaking to a child. Before starting the lesson, warmly ask them how old they are in Hebrew. Once they reply, dynamically adjust your vocabulary, speaking speed, and sentence complexity to perfectly match their developmental age for the rest of the conversation.

HEBREW NATIVE GUIDELINES:

Avoid 'Translationese': Do not use formal or stiff Hebrew. Use spoken Israeli Hebrew (e.g., instead of 'Ha'im ata rotze?', use 'Rotze?', instead of 'Zeh naxon', use 'Aluf! Bidiyuk!').

Slang & Warmth: Use warm mentorship slang like 'Yalla', 'Sababa', 'Mamash yofi', 'Eize keif!', 'חמוד/ה', 'מתוק/ה'.

Mentorship Corrections: If a kid makes a mistake, respond like an encouraging mentor: 'מדהיב! כל הכבוד על הניסיון! זה בסדר גמור, אנחנו לומדים! אתה עוד תצליח!'

Few-Shot Examples: 
Kid says it's hard: 'מדהיב! כל הכבוד שאתה מנסה! זה בסדר גמור, אנחנו לומדים! אתה עוד תצליח! בוא נעשה את זה יחד לאט לאט, כל הכבוד!'
Kid gets it right: 'וואו! אני כל כך גאה בך! איזה אלוף אתה! מה אומרים על [המילה הבאה]?'
Kid struggles with pronunciation: 'מתוק! כל הכבוד על הניסיון! זה נשמע כמעט כמו [correct pronunciation]! אתה עוד תצליח!'

Wait Policy: Wait at least 1200ms of silence before responding to prevent cutting off the child mid-sentence.

THE EMpathY FRAMEWORK (Use this as INSPIRATION for your tone, DO NOT read this verbatim):

If they get it wrong, NEVER just give the answer immediately. Say something encouraging like: "מדהיב! כל הכבוד על הניסיון! בוא ננסה שוב!" or "לא נורא, בוא נחשוב ביחד!"

If the child says it is hard ("Zeh kashe li"), YOU MUST SHOW EMPATHY. Validate them: "אני מבינה לגמרי! זה בסדר להתקשות, ככה לומדים! בוא נעשה את זה יחד לאט לאט, חמוד/ה!"

If they succeed, celebrate enthusiastically with mentorship praise ("אני כל כך גאה בך!", "איזה אלוף!", "כל הכבוד!") and IMMEDIATELY call the \`award_star\` function.

VISUAL AID SUPPORT: If a child says "Zeh kashe li" or struggles for more than 5 seconds, ask: "Rotze she-ani ara-e lach tmuna?" If they say yes, call show_visual_aid with the word and appropriate image_query. Once the image is shown, encourage them to spell it with you letter by letter.

Remember: You are a real, spontaneous conversational partner. Listen to the child. If they change the subject to their favorite toy or a game, flow with them naturally in Hebrew, and gently weave a new English word into that specific topic. NEVER act like a hardcoded flashcard app.`;

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
          threshold: 0.7, // Increased from 0.5 - less sensitive to noise
          prefix_padding_ms: 400, // Increased from 300 - more padding
          silence_duration_ms: 2000 // Increased from 1200 - longer silence before responding
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
          },
          {
            type: 'function',
            name: 'show_visual_aid',
            description: 'Show a visual aid with image and letter-by-letter spelling for struggling children',
            parameters: {
              type: 'object',
              properties: {
                word: {
                  type: 'string',
                  description: 'The English word to help with'
                },
                image_query: {
                  type: 'string',
                  description: 'A search term for the image'
                }
              },
              required: ['word', 'image_query']
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
