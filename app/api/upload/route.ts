import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateFileType, validateFileSize, saveUploadedFile, UploadType } from '@/lib/upload';

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

    // Validate file
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit' }, { status: 400 });
    }

    if (!validateFileType(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' }, { status: 400 });
    }

    // Save the file and get the URL
    const { fileUrl, fileName } = await saveUploadedFile(file, uploadType);
    
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