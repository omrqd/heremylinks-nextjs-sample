# Cloudflare R2 Setup Guide

## Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name it `heremylinks` (or your preferred name)
5. Click **Create bucket**

## Step 2: Generate R2 API Tokens

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Give it a name like `heremylinks-api`
4. Select permissions: **Object Read & Write**
5. Click **Create API Token**
6. **Copy and save** the credentials shown (you won't see them again!):
   - Access Key ID
   - Secret Access Key

## Step 3: Set Up Custom Domain (Optional but Recommended)

### Option A: Using R2.dev Subdomain (Free, Easy)
1. In your bucket settings, go to **Settings**
2. Under **Public Access**, click **Allow Access**
3. Click **Connect Domain**
4. You'll get a URL like: `https://pub-xxxxx.r2.dev`

### Option B: Using Custom Domain (Professional)
1. Go to your bucket → **Settings** → **Custom Domains**
2. Click **Connect Domain**
3. Enter your domain (e.g., `cdn.heremylinks.com`)
4. Add the CNAME record to your DNS
5. Wait for DNS propagation (~5 minutes)

## Step 4: Add Environment Variables

Add these to your `.env.local` file:

```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id_from_step_2
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_from_step_2
R2_BUCKET_NAME=heremylinks
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Where to find these values:

- **R2_ACCOUNT_ID**: Found in R2 dashboard URL or account settings
- **R2_ACCESS_KEY_ID**: From Step 2 (API token creation)
- **R2_SECRET_ACCESS_KEY**: From Step 2 (API token creation)
- **R2_BUCKET_NAME**: The name you chose in Step 1
- **R2_ENDPOINT**: Format is `https://[account_id].r2.cloudflarestorage.com`
- **R2_PUBLIC_URL**: From Step 3 (your R2.dev URL or custom domain)

## Step 5: Test the Connection

After adding the environment variables, restart your dev server and upload a profile image. Check the terminal logs for:

```
✅ Uploaded to R2: https://your-domain.com/profiles/uuid.jpg
```

## CORS Configuration (if using custom domain)

If you're using a custom domain and need browser uploads, add CORS rules to your R2 bucket:

1. Go to your bucket → **Settings** → **CORS Policy**
2. Add this configuration:

```json
[
  {
    "AllowedOrigins": ["https://heremylinks.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Benefits of R2 vs Local Storage

✅ **No Egress Fees** - Unlike S3, R2 doesn't charge for bandwidth  
✅ **Global CDN** - Fast delivery worldwide  
✅ **Scalable** - Handle millions of files  
✅ **Reliable** - Cloudflare's infrastructure  
✅ **Affordable** - $0.015/GB storage (much cheaper than S3)  
✅ **No Upload Limit** - Unlike your server  

## Troubleshooting

### Error: "Failed to upload file to R2"
- Check your R2 credentials are correct
- Verify your R2_ENDPOINT matches your account ID
- Ensure your API token has Read & Write permissions

### Error: "Access Denied"
- Make sure your bucket has public access enabled
- Verify your custom domain CNAME is set correctly
- Check CORS settings if uploading from browser

### Images not loading
- Verify R2_PUBLIC_URL is set correctly
- Check bucket public access is enabled
- Try accessing the URL directly in browser

## Migration from Local Storage

Your old images in `public/uploads/` will still work. To migrate them to R2:

1. Run the migration script (coming soon)
2. Or manually upload them via Cloudflare dashboard
3. Update database records to point to R2 URLs

## Next Steps

After R2 is working:
1. Test all upload types (profile, hero, backgrounds, link images)
2. Test image deletion
3. Deploy to production
4. Update production environment variables
5. Remove old `public/uploads/` directory

