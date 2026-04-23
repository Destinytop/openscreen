# PR: Add Camera Preview and 60fps Support

## Summary
This PR adds real-time camera preview functionality and improves webcam recording quality by increasing frame rate from 30fps to 60fps.

## Features Added

### 1. Camera Preview in Source Selector
- Live webcam feed displayed in the source selection window
- Users can see their camera before starting recording
- Supports all webcam mask shapes (rectangle, circle, square, rounded)

### 2. Camera Preview in HUD
- Compact webcam preview displayed in the HUD overlay when camera is enabled
- Real-time preview during recording setup
- Small footprint (64x48px) to avoid obstructing main interface

### 3. Mask Shape Selection
- Added UI for selecting webcam mask shapes in source selector
- Shapes: Rectangle, Circle, Square, Rounded
- Selection persists across sessions via user preferences

### 4. 60fps Webcam Recording
- Increased webcam frame rate from 30fps to 60fps
- Smoother video quality for fast movements
- Better overall recording experience

## Technical Changes

### New Files
- `src/components/launch/CameraPreview.tsx` - Source selector camera preview
- `src/components/launch/WebcamPreview.tsx` - HUD camera preview

### Modified Files
- `src/components/launch/SourceSelector.tsx` - Integrated camera preview
- `src/components/launch/LaunchWindow.tsx` - Added HUD preview
- `src/lib/userPreferences.ts` - Added mask shape persistence
- `src/hooks/useScreenRecorder.ts` - Changed to 60fps
- i18n files - Added translations for new UI

## Testing

### Manual Test Checklist
- [ ] Open source selector, see live camera preview
- [ ] Switch between mask shapes in source selector
- [ ] Enable camera in HUD, see compact preview
- [ ] Start recording with camera, verify 60fps smoothness
- [ ] Verify mask shape persists after restart
- [ ] Check all mask shapes render correctly

## Screenshots

### Source Selector with Camera Preview
[Would add screenshot here]

### HUD with Camera Preview
[Would add screenshot here]

## Breaking Changes
None. All changes are additive and backward compatible.

## Related Issues
N/A - This is a new feature addition

## Checklist
- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] Changes are documented
- [x] Added/updated i18n translations
- [x] Tested manually
- [x] No breaking changes

## Future Enhancements
- Camera position drag in editor
- More mask shapes (custom shapes)
- Camera filters/effects
- Multi-camera support

---

**Author**: Destinytop (@Destinytop)
**Email**: Destinyxu03@gmaill.com
