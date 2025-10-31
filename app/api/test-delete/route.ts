import { NextRequest, NextResponse } from 'next/server';
import { deleteFromR2 } from '@/lib/r2';

// TEST endpoint to verify R2 file deletion works
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    console.log('🧪 TEST: Attempting to delete from R2:', fileUrl);
    
    await deleteFromR2(fileUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'R2 file deletion attempted. Check console logs.'
    });
  } catch (error) {
    console.error('Test deletion error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: String(error) },
      { status: 500 }
    );
  }
}

