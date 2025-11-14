# Large Image Crop Feature

## Overview
The Large Image crop feature allows users to select the exact portion of their uploaded image that will be displayed in the Large Image link type on their bio page.

## Problem Solved
Previously, when users uploaded portrait images (like model photos) for the Large Image component, the image would appear differently between:
- The dashboard preview section
- The live public bio page

This was because the images were being automatically cropped by the browser using `object-fit: cover`, which could result in different parts of the image being visible depending on the container size.

## Solution
When users upload an image for a Large Image link, they now go through a cropping workflow:

1. **Upload Image**: User selects or drags an image file
2. **Crop Interface**: A cropping modal appears with:
   - Interactive cropping area with handles
   - Zoom slider to adjust the image scale
   - Drag functionality to reposition the image
   - Real-time preview of the crop area
3. **Apply Crop**: User confirms the crop, and only the selected area is uploaded

## Technical Implementation

### Components Created

#### `ImageCropper.tsx`
- Uses `react-easy-crop` library (already installed)
- Provides an intuitive cropping interface
- Aspect ratio: 4:5 (portrait orientation, optimized for mobile viewing)
- Features:
  - Zoom control (1x to 3x)
  - Drag to reposition
  - Visual feedback with gradient overlays
  - Processing indicator

#### `FileUploadWithCrop.tsx`
- Extended version of the original `FileUpload` component
- Adds optional cropping functionality
- Props:
  - `enableCrop`: Boolean to enable/disable cropping
  - `cropAspectRatio`: Configurable aspect ratio for the crop

### Integration

In `app/dashboard/page.tsx`:
- Large Image uploads now use `FileUploadWithCrop` with cropping enabled
- Other image layouts continue to use the standard `FileUpload` component
- Aspect ratio set to 4:5 for optimal portrait image display

## User Experience

### Dashboard Flow
1. User clicks "Add Link" → "Large Image"
2. User uploads an image (drag-and-drop or click to browse)
3. Cropping modal appears automatically
4. User adjusts the crop area and zoom level
5. User clicks "Apply Crop"
6. Cropped image is uploaded and displayed in preview

### Benefits
- **Consistency**: Same image area appears in both preview and live page
- **Control**: Users decide exactly what part of the image to display
- **Portrait Support**: 4:5 aspect ratio works perfectly for portrait photos
- **Mobile Optimized**: Aspect ratio chosen for typical mobile viewing

## Aspect Ratio Choice

The 4:5 aspect ratio (0.8) was chosen because:

1. **Mobile First**: Most bio link views occur on mobile devices
   - Typical mobile width: 390px
   - Large Image height: 500px
   - Resulting aspect: ~0.78 (very close to 4:5)

2. **Portrait Images**: Perfect for model photos, headshots, and portraits

3. **Minimal Cropping**: On larger screens, the image may show slightly more on the sides, but the main subject (chosen by the user) remains centered

## CSS Compatibility

The feature works seamlessly with existing CSS:

```css
.bioLink.layoutImageLarge .linkImageTop img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

The `object-fit: cover` ensures the cropped image fills the container while maintaining its aspect ratio.

## Future Enhancements

Potential improvements:
- Allow users to re-crop existing images
- Add preset aspect ratios (square, landscape, portrait)
- Save crop coordinates instead of re-uploading (for faster edits)
- Add crop rotation support
- Preview what the image will look like on different device sizes

## Files Modified

1. `components/ImageCropper.tsx` (new)
2. `components/FileUploadWithCrop.tsx` (new)
3. `app/dashboard/page.tsx` (modified - added import and conditional rendering)

## Dependencies

- `react-easy-crop`: ^5.5.3 (already installed in package.json)

No additional dependencies were required.

