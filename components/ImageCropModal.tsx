'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string, cropData: CropData) => void;
  onCancel: () => void;
  aspectRatio?: number | null; // Allow null for free-form cropping
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9, // Default aspect ratio
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(aspectRatio === null ? 0.6 : 1); // Start moderately zoomed out for free-form
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Set initial crop size for free-form crops (especially for portrait images)
  useEffect(() => {
    if (aspectRatio === null && imageSrc) {
      const img = new Image();
      img.onload = () => {
        // For portrait images, start with a crop area that covers most of the image
        const isPortrait = img.height > img.width;
        if (isPortrait) {
          // Set smaller crop size that's easier to reach
          setCropSize({ width: 250, height: 320 });
          setZoom(0.5); // Moderate zoom for portraits
        } else {
          setCropSize({ width: 400, height: 250 });
          setZoom(0.6);
        }
      };
      img.src = imageSrc;
    }
  }, [aspectRatio, imageSrc]);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    
    try {
      const image = new Image();
      image.src = imageSrc;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas size to cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob
      return new Promise<string>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedImageUrl = URL.createObjectURL(blob);
            resolve(croppedImageUrl);
          }
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImageUrl = await createCroppedImage();
      if (croppedImageUrl) {
        const cropData: CropData = {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        };
        onCropComplete(croppedImageUrl, cropData);
      }
    } catch (error) {
      console.error('Failed to save cropped image:', error);
    }
  };

  // Don't render until mounted (avoid SSR issues)
  if (!mounted) return null;

  const modalContent = (
    <div className="crop-modal-overlay">
      <div className="crop-modal">
        <div className="crop-modal-header">
          <h2>Crop Image</h2>
          {aspectRatio === null && (
            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
              Drag corners to resize • Zoom out to see full image
            </p>
          )}
          <button onClick={onCancel} className="close-btn" title="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            {...(aspectRatio !== null && { aspect: aspectRatio })}
            {...(cropSize && { cropSize })}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
            restrictPosition={false}
            objectFit={aspectRatio === null ? 'vertical-cover' : 'contain'}
            showGrid={true}
            minZoom={0.1}
            maxZoom={5}
            zoomSpeed={0.5}
          />
        </div>

        <div className="crop-controls">
          <div className="zoom-control">
            <i className="fas fa-search-minus"></i>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <i className="fas fa-search-plus"></i>
          </div>
          <div className="zoom-info">
            <small style={{ color: '#888', marginTop: '8px', display: 'block', textAlign: 'center' }}>
              Zoom: {zoom.toFixed(1)}x {aspectRatio === null && '• Drag corners to resize crop area'}
            </small>
          </div>
        </div>

        <div className="crop-modal-footer">
          <button onClick={onCancel} className="cancel-btn" disabled={isProcessing}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Save & Upload'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .crop-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          animation: fadeIn 0.2s ease;
          overflow-y: auto;
        }

        .crop-modal {
          background: #ffffff;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          margin: 20px auto;
          position: relative;
        }

        .crop-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-bottom: 1px solid #e5e7eb;
        }

        .crop-modal-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f3f4f6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #1a1a1a;
          transform: rotate(90deg);
        }

        .crop-container {
          position: relative;
          width: 100%;
          height: 350px;
          background: #000000;
        }

        .crop-controls {
          padding: 20px 28px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .zoom-control {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .zoom-control i {
          color: #6b7280;
          font-size: 16px;
        }

        .zoom-control input[type="range"] {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 4px;
          outline: none;
          -webkit-appearance: none;
        }

        .zoom-control input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .zoom-control input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .crop-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 28px;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-btn,
        .save-btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #e5e7eb;
          color: #1a1a1a;
        }

        .save-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .save-btn:disabled,
        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .crop-modal {
            width: 95%;
            max-height: 95vh;
          }

          .crop-container {
            height: 300px;
          }

          .crop-modal-header,
          .crop-controls,
          .crop-modal-footer {
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
};

export default ImageCropModal;

