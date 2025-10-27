'use client';

import { useState, useRef, forwardRef } from 'react';
import Image from 'next/image';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string) => void;
  uploadType: 'profile' | 'link';
  className?: string;
  currentImage?: string;
  buttonText?: string;
  hideButton?: boolean;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(({
  onUploadComplete,
  uploadType,
  className = '',
  currentImage,
  buttonText = 'Upload Image',
  hideButton = false
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the forwarded ref if provided, otherwise use local ref
  const fileInputRef = (ref as React.RefObject<HTMLInputElement>) || localFileInputRef;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file
      const response = await fetch(`/api/upload?type=${uploadType}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Set preview and call the callback
      setPreviewUrl(data.fileUrl);
      onUploadComplete(data.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Removed preview image to prevent duplication */}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        id={uploadType === 'link' ? 'linkImageInput' : undefined}
      />

      {!hideButton && (
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="upload-button"
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isUploading ? 'Uploading...' : buttonText}
        </button>
      )}

      {error && <p className="error-message" style={{ color: 'red', marginTop: '5px', fontSize: '14px' }}>{error}</p>}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;