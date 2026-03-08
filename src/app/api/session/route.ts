import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 API route called');
    
    // For OpenAI Realtime API, we need to return the API key for WebSocket authentication
    // The API has changed and no longer uses ephemeral tokens for WebSocket connections
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔑 Raw API key from env:', apiKey ? 'EXISTS' : 'NULL');
    console.log('🔑 API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.log('❌ API key not found in environment');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 API key found, returning response...');
    
    return NextResponse.json({
      apiKey: apiKey,
      model: 'gpt-4o-realtime-preview-2024-10-01',
      instructions: 'You are Koko, a friendly English tutor for kids. The user is a native Hebrew speaker. Respond only in English, keep sentences short and encouraging.',
      test: 'API key retrieved (validation bypassed)',
    });
  } catch (error) {
    console.error('❌ Failed to create OpenAI session:', error);
    
    if (error instanceof Error) {
      console.log('❌ Error details:', error.message);
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('❌ Unknown error occurred');
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
