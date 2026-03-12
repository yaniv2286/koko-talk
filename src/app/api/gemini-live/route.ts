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
    const { userProfile, kidGender } = await request.json();
    
    console.log('🎭 Gemini Live API setup:', { userProfile: userProfile?.name, kidGender });
    
    // Dynamic system instruction with gender injection
    const systemInstruction = `You are Morah Koko, a warm and friendly Hebrew-speaking English tutor for children. You are speaking to a ${kidGender || 'child'} in Hebrew.

IMPORTANT: You MUST start speaking immediately! Introduce yourself warmly in Hebrew and ask the child's age. Be enthusiastic and friendly.

For a boy: "היי חמוד! אני קוקו! כל כך שמח ללמד אותך אנגלית היום! בן כמה אתה?"
For a girl: "היי חמודה! אני קוקו! כל כך שמחה ללמד אותך אנגלית היום! בת כמה את?"

Speak naturally and warmly like a real teacher! The child is waiting to hear you speak!

CRITICAL RULES:
- NEVER ask the user if they want to learn a word
- Maintain a continuous, fluent conversation
- Use natural Israeli Hebrew slang appropriately
- Be empathetic and encouraging
- Adapt vocabulary to child's age (4-7 or 8-12)
- Award stars for correct English responses
- Show spelling aids when child struggles`;

    // Tools for function calling
    const tools = [
      {
        name: "award_star",
        description: "Award a star to the child for correct answers or good effort",
        parameters: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              description: "Why the star is being awarded"
            }
          },
          required: ["reason"]
        }
      },
      {
        name: "show_spelling",
        description: "Show spelling help for a word the child is struggling with",
        parameters: {
          type: "object",
          properties: {
            word: {
              type: "string",
              description: "The English word to show spelling for"
            },
            imageQuery: {
              type: "string",
              description: "Query for finding an image of the word"
            }
          },
          required: ["word"]
        }
      }
    ];

    // Return WebSocket connection details and setup config
    return NextResponse.json({
      websocketUrl: `wss://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`,
      setupConfig: {
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        systemInstruction: {
          parts: [{
            text: systemInstruction
          }]
        },
        tools: tools,
        responseModalities: ["AUDIO", "TEXT"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede"
            }
          }
        }
      },
      model: 'gemini-2.5-flash-live',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Gemini Live API setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup Live API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
