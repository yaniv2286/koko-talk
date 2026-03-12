import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
    
    // Try to list available models
    console.log('🔍 Fetching available models...');
    
    // Test different model names
    const modelsToTest = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-pro-vision',
      'text-bison-001',
      'chat-bison-001'
    ];
    
    const results = [];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        // Try a simple generateContent call to see if it works
        const result = await model.generateContent("Hello");
        results.push({ model: modelName, status: 'available', response: 'success' });
      } catch (error) {
        results.push({ 
          model: modelName, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return NextResponse.json({
      api_key_set: true,
      tested_models: results
    });
    
  } catch (error) {
    console.error('❌ Model list error:', error);
    return NextResponse.json(
      { error: 'Failed to list models', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
