import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2, validateFile } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
      }
      // 10MB limit for images
      try {
        validateFile(file, 10);
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
      }
      // 50MB limit for videos
      try {
        validateFile(file, 50);
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Upload to R2 (use 'video' or 'background' as upload type)
    const uploadType = type === 'video' ? 'video' : 'background';
    const { fileUrl } = await uploadToR2(file, uploadType);

    return NextResponse.json({
      success: true,
      path: fileUrl,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

