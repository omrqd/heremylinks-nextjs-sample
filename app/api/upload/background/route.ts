import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

    // Validate file type
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
      }
      // 10MB limit for images
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be less than 10MB' }, { status: 400 });
      }
    } else if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
      }
      // 50MB limit for videos
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video must be less than 50MB' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const userId = session.user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const extension = file.name.split('.').pop();
    const filename = `${userId}-${timestamp}.${extension}`;

    // Determine upload directory
    const uploadDir = type === 'video' ? 'videos' : 'backgrounds';
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads', uploadDir);

    // Ensure directory exists
    if (!existsSync(uploadsPath)) {
      await mkdir(uploadsPath, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsPath, filename);

    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `/uploads/${uploadDir}/${filename}`;

    return NextResponse.json({
      success: true,
      path: publicPath,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

