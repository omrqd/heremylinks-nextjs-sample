import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Upload types
export type UploadType = 'profile' | 'link';

/**
 * Validates file type
 */
export const validateFileType = (mimetype: string): boolean => {
  return ALLOWED_FILE_TYPES.includes(mimetype);
};

/**
 * Validates file size
 */
export const validateFileSize = (size: number): boolean => {
  return size <= MAX_FILE_SIZE;
};

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove any path components
  const basename = path.basename(filename);
  // Replace any non-alphanumeric characters except for dots, dashes, and underscores
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Saves an uploaded file to the appropriate directory
 */
export const saveUploadedFile = async (
  file: File,
  uploadType: UploadType
): Promise<{ fileUrl: string; fileName: string }> => {
  // Generate a unique filename
  const fileExt = path.extname(sanitizeFilename(file.name)) || '.jpg';
  const fileName = `${uuidv4()}${fileExt}`;
  
  // Determine upload directory based on type
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadType === 'profile' ? 'profiles' : 'links');
  
  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  // Convert file to buffer and save it
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  
  // Generate the public URL for the file
  const fileUrl = `/uploads/${uploadType === 'profile' ? 'profiles' : 'links'}/${fileName}`;
  
  return { fileUrl, fileName };
};