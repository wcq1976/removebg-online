import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image_file') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Forward to Remove.bg API
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', imageFile);
    removeBgFormData.append('size', 'auto');
    removeBgFormData.append('format', 'png');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY || 'e1c7d8d6f5c4a3b2e1d0c9a8b7c6d5e4',
      },
      body: removeBgFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: 'Remove.bg API failed', details: error }, { status: response.status });
    }

    const blob = await response.blob();
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="result.png"',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
