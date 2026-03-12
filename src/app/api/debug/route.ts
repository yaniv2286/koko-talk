import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    return NextResponse.json({
      google_ai_key_set: !!GOOGLE_AI_API_KEY,
      google_ai_key_length: GOOGLE_AI_API_KEY?.length || 0,
      google_ai_key_preview: GOOGLE_AI_API_KEY ? `${GOOGLE_AI_API_KEY.substring(0, 10)}...` : 'not_set',
      openai_key_set: !!OPENAI_API_KEY,
      openai_key_length: OPENAI_API_KEY?.length || 0,
      instructions: {
        google_ai: "Get your API key from https://makersuite.google.com/app/apikey",
        setup: "Add GOOGLE_AI_API_KEY=your_actual_key_here to .env.local file"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Debug route error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
