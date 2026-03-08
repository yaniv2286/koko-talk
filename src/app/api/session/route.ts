import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('API ROUTE CALLED');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API KEY CHECK:', apiKey ? 'EXISTS' : 'NULL');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      apiKey: apiKey,
      model: 'gpt-4o-realtime-preview-2024-12-17',
      instructions: 'You are Koko, a friendly English tutor for kids. The user is a native Hebrew speaker. Respond only in English, keep sentences short and encouraging.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
