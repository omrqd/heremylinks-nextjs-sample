# Production Build Fix

## Issue
Build failing with "Module not found" errors for components that exist in the repository.

## Solution

Run these commands on your production server:

```bash
# 1. Navigate to your project directory
cd /home/heremylinks/htdocs/heremylinks.com/heremylinks-nextjs-sample

# 2. Pull the latest code from git
git pull origin main
# (or whatever your branch name is: git pull origin master)

# 3. Verify components directory exists
ls -la components/

# 4. Clean Next.js cache
rm -rf .next

# 5. Clean node_modules and reinstall (if needed)
rm -rf node_modules
npm install

# 6. Build again
npm run build

# 7. Start the production server
npm start
# Or if using PM2:
pm2 restart your-app-name
```

## Quick Fix (if above doesn't work)

If you still get errors, try this:

```bash
# 1. Verify all files are present
ls -la components/
# Should show: ToastProvider.tsx, FileUpload.tsx, ImageCropModal.tsx, ConfirmModal.tsx

# 2. Check if files are actually in git
git ls-files components/

# 3. If files are missing, pull them
git checkout main -- components/

# 4. Clean everything and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Verification

Make sure all these files exist:
- ✅ components/ToastProvider.tsx
- ✅ components/FileUpload.tsx
- ✅ components/ImageCropModal.tsx
- ✅ components/ConfirmModal.tsx

## Common Issues

1. **Git not up to date**: Run `git pull` to get latest code
2. **Stale cache**: Delete `.next` folder
3. **Case sensitivity**: Linux is case-sensitive, make sure file names match exactly
4. **Node modules**: Reinstall with `npm install`

## After Build Success

```bash
# If using PM2
pm2 restart your-app

# If using npm
npm start

# If using a process manager
systemctl restart your-app
```

