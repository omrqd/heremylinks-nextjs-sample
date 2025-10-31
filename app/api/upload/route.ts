import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2, UploadType, validateFile } from '@/lib/r2';

// POST handler for file uploads
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get upload type from query params (profile, link, or hero)
    const { searchParams } = new URL(req.url);
    const uploadType = searchParams.get('type') as UploadType | null;
    
    if (!uploadType || !['profile', 'link', 'hero'].includes(uploadType)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file (max 10MB for images)
    try {
      validateFile(file, 10);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' 
      }, { status: 400 });
    }

    // Upload to R2 and get the URL
    const { fileUrl, fileName } = await uploadToR2(file, uploadType);
    
    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileName
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}