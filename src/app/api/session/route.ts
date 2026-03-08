import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🔑🔑🔑 API ROUTE CALLED AT ALL!!!');
  
  try {
    // Ultra simple test - no variables, no logic, just return a response
    console.log('🔑🔑🔑 Returning ultra-simple response...');
    
    return NextResponse.json({
      message: 'API route is working',
      test: true,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.log('🔑🔑🔑 ERROR IN API ROUTE:', error);
    return NextResponse.json({
      error: 'API route error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
