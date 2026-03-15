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

    // Tools for function calling - Gemini Live API format
    const tools = [
      {
        functionDeclarations: [
          {
            name: "award_star",
            description: "Call this immediately when the child succeeds, tries hard, or answers correctly to give them a star reward."
          },
          {
            name: "show_spelling",
            description: "Call this when teaching a new word to display it visually.",
            parameters: {
              type: "OBJECT",
              properties: {
                word: { type: "STRING" }
              },
              required: ["word"]
            }
          }
        ]
      }
    ];

    // Return WebSocket connection details and setup config
    return NextResponse.json({
      websocketUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GOOGLE_AI_API_KEY}`,
      setupConfig: {
        model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede"
              }
            }
          }
        },
        systemInstruction: {
          parts: [{
            text: systemInstruction
          }]
        },
        tools: tools
      },
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
