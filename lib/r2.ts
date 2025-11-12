import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // Your R2 public domain

// Upload types
export type UploadType = 'profile' | 'link' | 'hero' | 'background' | 'video' | 'product';

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: File,
  uploadType: UploadType
): Promise<{ fileUrl: string; fileName: string }> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uploadType}s/${uuidv4()}.${fileExt}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine content type
    const contentType = file.type || 'application/octet-stream';

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      // Make file publicly accessible
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await r2Client.send(command);

    // Generate public URL
    const fileUrl = `${PUBLIC_URL}/${fileName}`;

    console.log('✅ Uploaded to R2:', fileUrl);

    return { fileUrl, fileName };
  } catch (error) {
    console.error('❌ R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) return;

  try {
    // Extract the filename from the URL
    // URLs will be like: https://your-domain.r2.dev/profiles/uuid.jpg
    const url = new URL(fileUrl);
    const fileName = url.pathname.substring(1); // Remove leading slash

    // Skip if it's not an R2 file
    if (!fileUrl.includes(PUBLIC_URL)) {
      console.log('⚠️  Not an R2 file, skipping:', fileUrl);
      return;
    }

    console.log('🗑️  Deleting from R2:', fileName);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);

    console.log('✅ Deleted from R2:', fileName);
  } catch (error) {
    console.error('❌ R2 deletion error:', error);
    // Don't throw - allow operation to continue even if deletion fails
  }
}

/**
 * Get a file from R2 (for server-side processing if needed)
 */
export async function getFromR2(fileName: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const response = await r2Client.send(command);
    
    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('❌ R2 get error:', error);
    return null;
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, maxSizeMB: number = 10): boolean {
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }

  return true;
}

/**
 * Get content type from file extension
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
}

