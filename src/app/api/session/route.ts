import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // For OpenAI Realtime API, we need to return the API key for WebSocket authentication
    // The API has changed and no longer uses ephemeral tokens for WebSocket connections
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Test the API key by making a simple request to OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Make a simple test request to verify the API key works
    const models = await openai.models.list();
    
    return NextResponse.json({
      apiKey: apiKey,
      model: 'gpt-4o-realtime-preview-2024-10-01',
      instructions: 'You are Koko, a friendly English tutor for kids. The user is a native Hebrew speaker. Respond only in English, keep sentences short and encouraging.',
      test: 'API key is valid',
    });
  } catch (error) {
    console.error('Failed to create OpenAI session:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
