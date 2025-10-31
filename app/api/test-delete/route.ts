import { NextRequest, NextResponse } from 'next/server';
import { deleteUploadedFile } from '@/lib/upload';

// TEST endpoint to verify file deletion works
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    console.log('🧪 TEST: Attempting to delete:', fileUrl);
    
    await deleteUploadedFile(fileUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'File deletion attempted. Check console logs.'
    });
  } catch (error) {
    console.error('Test deletion error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: String(error) },
      { status: 500 }
    );
  }
}

