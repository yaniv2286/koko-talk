import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Create ephemeral token for OpenAI Realtime API
    const sessionData = await openai.beta.realtime.sessions.create({
      model: 'gpt-4o-realtime-preview-2024-10-01',
      voice: 'alloy',
      // Configure the AI with the specified system prompt
      instructions: 'You are Koko, a friendly English tutor for kids. The user is a native Hebrew speaker. Respond only in English, keep sentences short and encouraging.',
      // Set reasonable defaults for kids
      temperature: 0.7,
      max_response_output_tokens: 250,
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      // Audio settings optimized for voice interaction
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      // Tool disabled for now - we'll add this in later phases
      tool_choice: 'auto',
      tools: [],
    });

    return NextResponse.json({
      client_secret: {
        value: (sessionData as any).client_secret,
        expires_at: (sessionData as any).expires_at,
      },
      ephemeralToken: (sessionData as any).id || sessionData._request_id,
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
