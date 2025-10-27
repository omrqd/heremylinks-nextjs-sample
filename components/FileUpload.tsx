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
  showPreview?: boolean; // allow hiding preview when component is used invisibly
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(({
  onUploadComplete,
  uploadType,
  className = '',
  currentImage,
  buttonText = 'Upload Image',
  hideButton = false,
  showPreview = true
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use the forwarded ref if provided, otherwise use local ref
  const fileInputRef = (ref as React.RefObject<HTMLInputElement>) || localFileInputRef;

  const processFile = async (file: File) => {
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload?type=${uploadType}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setPreviewUrl(data.fileUrl);
      onUploadComplete(data.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Drag & drop handlers (used for link image uploads)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-upload ${className}`}>
      {showPreview && previewUrl && (
        <div className="imagePreview">
          <Image 
            src={previewUrl} 
            alt="Preview" 
            fill
            style={{ objectFit: 'cover' }}
          />
          <button 
            onClick={() => {
              setPreviewUrl(null);
              onUploadComplete('');
            }}
            className="removeImageBtn"
            type="button"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        id={uploadType === 'link' ? 'linkImageInput' : undefined}
      />

      {/* For link uploads, show drag-and-drop zone instead of a button */}
      {uploadType === 'link' && !previewUrl && (
        <div 
          className={`dropZone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          role="button"
          aria-label="Upload link image"
        >
          <div className="uploadPrompt">
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                <p>Uploading image…</p>
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
                <p><strong>Click to upload</strong> or drag and drop</p>
                <p>SVG, PNG, JPG or GIF (max. 800x400px)</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* For profile uploads, optionally show a minimal button if requested; default hide */}
      {uploadType === 'profile' && !hideButton && !previewUrl && (
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
            borderRadius: '8px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} /> Uploading...
            </>
          ) : buttonText}
        </button>
      )}

      {error && <p className="error-message" style={{ color: 'red', marginTop: '5px', fontSize: '14px' }}>{error}</p>}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;