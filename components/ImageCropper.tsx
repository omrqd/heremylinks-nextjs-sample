'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Type definitions for react-easy-crop
interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({ 
  image, 
  onCropComplete, 
  onCancel,
  aspectRatio = 16 / 9  // Default aspect ratio for Large Image (500px height in a responsive width)
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) {
      throw new Error('No crop area defined');
    }

    return new Promise((resolve, reject) => {
      const imageElement = new Image();
      imageElement.src = image;
      imageElement.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas size to the cropped area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Draw the cropped image
        ctx.drawImage(
          imageElement,
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
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.95
        );
      };
      imageElement.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage();
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <i className="fas fa-crop" style={{ marginRight: '10px' }}></i>
            Crop Your Image
          </h3>
          <button onClick={onCancel} style={styles.closeBtn} disabled={isProcessing}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={styles.cropperContainer}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
            style={{
              containerStyle: {
                borderRadius: '12px',
                backgroundColor: '#000',
              },
            }}
          />
        </div>

        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>
              <i className="fas fa-search-plus" style={{ marginRight: '8px' }}></i>
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>

        <div style={styles.instructions}>
          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Drag to reposition, use the slider to zoom. The selected area will appear in your Large Image link.
        </div>

        <div style={styles.actions}>
          <button onClick={onCancel} style={styles.cancelBtn} disabled={isProcessing}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            style={{...styles.saveBtn, ...(isProcessing ? styles.saveBtnDisabled : {})}}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                Apply Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 28px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  cropperContainer: {
    position: 'relative',
    width: '100%',
    height: '400px',
    backgroundColor: '#000',
    borderRadius: '12px',
    margin: '20px 0',
    overflow: 'hidden',
  },
  controls: {
    padding: '0 28px 20px',
  },
  controlGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    outline: 'none',
    background: 'linear-gradient(to right, #e5e7eb 0%, #667eea 0%)',
    cursor: 'pointer',
  },
  instructions: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 28px',
    backgroundColor: '#f0f7ff',
    borderRadius: '12px',
    margin: '0 28px 20px',
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '20px 28px 28px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px 24px',
    backgroundColor: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif",
  },
  saveBtn: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Poppins', sans-serif",
  },
  saveBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

