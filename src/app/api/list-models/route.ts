import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Listing available models...');
    
    // List available models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_AI_API_KEY}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to list models:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to list models', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Models listed:', data.models?.length || 0);
    
    // Filter for models that support generateContent
    const generateContentModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];

    // Filter for models that support bidiGenerateContent (Live API)
    const liveApiModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('bidiGenerateContent')
    ) || [];

    console.log('🎙️ Live API models:', liveApiModels.map((m: any) => m.name));

    return NextResponse.json({
      total_models: data.models?.length || 0,
      generate_content_models: generateContentModels.length,
      live_api_models: liveApiModels.length,
      live_api_models_details: liveApiModels.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedGenerationMethods
      })),
      all_models: data.models?.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedGenerationMethods
      })) || [],
      generate_content_models_details: generateContentModels.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description
      }))
    });

  } catch (error) {
    console.error('❌ Model list error:', error);
    return NextResponse.json(
      { error: 'Failed to list models', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
