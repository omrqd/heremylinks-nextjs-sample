# Testing Instructions - Large Image Crop Feature

## How to Test the New Feature

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Dashboard
1. Go to `http://localhost:3000`
2. Log in to your account
3. Access the dashboard

### 3. Test Large Image Upload with Crop

#### Step-by-Step Test:
1. **Open Add Link Modal**
   - Click the "Add Link" button or section
   - Select "Large Image" layout

2. **Upload a Portrait Image**
   - Use a portrait-oriented image (recommended: model photo, headshot, or any tall image)
   - Either:
     - Drag and drop the image
     - Click to browse and select

3. **Cropping Interface Should Appear**
   - ✅ You should see a full-screen modal with:
     - The image loaded in a cropping interface
     - A visible crop area (4:5 aspect ratio - portrait)
     - A zoom slider at the bottom
     - Instructions text
     - "Cancel" and "Apply Crop" buttons

4. **Interact with the Cropper**
   - **Drag the image**: Click and drag to reposition
   - **Zoom**: Use the slider to zoom in/out (1x to 3x)
   - **Observe**: The crop area should remain fixed while the image moves behind it

5. **Apply the Crop**
   - Click "Apply Crop"
   - ✅ Modal should close
   - ✅ "Processing..." indicator should appear briefly
   - ✅ Cropped image should appear in the preview box

6. **Complete the Link**
   - Add a title (e.g., "Featured Model")
   - Add a URL (e.g., "https://example.com")
   - Click "Add Link"

7. **Check Dashboard Preview**
   - ✅ The Large Image link should appear in the preview section
   - ✅ The cropped area you selected should be visible
   - ✅ The image should have the gradient overlay and title at the bottom

8. **Check Live Bio Page**
   - Click "Preview" or "Publish" to view your live page
   - Navigate to your public bio URL
   - ✅ **The Large Image should show the EXACT same cropped area as the dashboard preview**
   - ✅ No unexpected cropping or different framing

### 4. Test Other Image Layouts (Should NOT Show Cropper)

Test that other layouts still work without the cropper:

1. **Image Left Layout**
   - Add Link → Select "Image Left"
   - Upload an image
   - ✅ Should upload directly **without showing the cropper**
   - ✅ Image should appear in preview

2. **Image Right Layout**
   - Add Link → Select "Image Right"
   - Upload an image
   - ✅ Should upload directly without cropping

3. **Image Top Layout**
   - Add Link → Select "Image Top"
   - Upload an image
   - ✅ Should upload directly without cropping

### 5. Edge Cases to Test

#### Cancel Cropping
1. Upload image for Large Image
2. Cropper appears
3. Click "Cancel"
4. ✅ Cropper closes, no image is saved
5. ✅ Can upload again

#### Replace Image
1. Add a Large Image link with cropped image
2. Click on the link to edit
3. Upload a new image
4. ✅ Cropper appears again
5. Crop and apply
6. ✅ Previous image is replaced

#### Large File
1. Try uploading a very large image (5-10MB)
2. ✅ Should work and crop successfully
3. ✅ Cropped image should be smaller than original

#### Different Aspect Ratios
1. Test with ultra-wide landscape image
   - ✅ Cropper shows 4:5 crop area
   - ✅ Can zoom and position to select portrait section
2. Test with square image
   - ✅ Cropper works correctly
3. Test with ultra-tall portrait image
   - ✅ Cropper works correctly

### 6. Responsive Testing

#### Mobile View (≤480px)
1. Resize browser or use mobile device
2. Add Large Image link
3. ✅ Cropper should be responsive
4. ✅ Touch gestures should work for dragging
5. ✅ Preview should show correctly
6. ✅ Live page should show same cropped area

#### Tablet View (≤768px)
1. Test at tablet size
2. ✅ Everything should work smoothly
3. ✅ Cropper should be usable

### 7. Visual Consistency Check

**Critical Test**: This is the main issue we're solving!

1. Add a Large Image link with a portrait model photo
2. **In Dashboard Preview**:
   - Take a screenshot or note which part of the model is visible
   - Note the framing (head position, body position, etc.)
3. **On Live Bio Page**:
   - View the same link
   - ✅ **The exact same part of the model should be visible**
   - ✅ **Framing should be identical**
   - ✅ **No unexpected cropping differences**

If the cropped area is consistent between preview and live page, the feature is working correctly! ✅

## Expected Results Summary

### ✅ Success Criteria
- [ ] Cropper appears only for Large Image layout
- [ ] Cropper has 4:5 aspect ratio (portrait)
- [ ] Can drag image to reposition
- [ ] Can zoom image (1x-3x)
- [ ] Can cancel cropping operation
- [ ] Can apply crop and upload
- [ ] Cropped image appears in dashboard preview
- [ ] Same cropped area appears on live bio page
- [ ] Other image layouts work without cropper
- [ ] No console errors
- [ ] Responsive on mobile/tablet
- [ ] Upload API accepts cropped images

### ❌ Failure Scenarios
If you see any of these, there's an issue:
- Cropper doesn't appear for Large Image
- Cropper appears for other layouts (should only be Large Image)
- Can't drag or zoom in the cropper
- Upload fails after cropping
- Different crop appears on live page vs preview
- Console errors
- Cropper UI is broken on mobile

## Troubleshooting

### Issue: Cropper doesn't appear
- Check browser console for errors
- Verify `react-easy-crop` is installed: `npm list react-easy-crop`
- Check that `FileUploadWithCrop` is imported correctly

### Issue: Upload fails after cropping
- Check Network tab for API errors
- Verify the blob-to-file conversion is working
- Check R2/Cloudflare upload configuration

### Issue: Different crop on live vs preview
- This shouldn't happen with our implementation
- Check that both use `object-fit: cover`
- Verify aspect ratio is 4:5 in both places

## Next Steps After Testing

If all tests pass:
1. ✅ Feature is ready for production
2. Test with real users on staging
3. Monitor for any edge cases
4. Collect feedback on the 4:5 aspect ratio choice

If tests fail:
1. Review console errors
2. Check file modifications
3. Verify imports and component usage
4. Test API endpoints manually

---

**Happy Testing!** 🎉

The cropping feature should make portrait images look consistent and professional across all views.

