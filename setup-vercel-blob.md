# Vercel Blob Setup Guide for Shanmukha Generators

## 🚀 Quick Setup Steps

### 1. Enable Vercel Blob in Your Project

**Option A: Via Vercel Dashboard (Easiest)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `shanmukha-generators` project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob** 
6. Choose your plan (Hobby plan includes 1GB free)
7. Click **Create**

**Option B: Via Vercel CLI**
```bash
# Login to Vercel (if not already logged in)
npx vercel login

# Link your project
npx vercel link

# Create Blob storage
npx vercel blob create
```

### 2. Environment Variables

After creating Blob storage, Vercel will automatically add these environment variables to your project:

- `BLOB_READ_WRITE_TOKEN` - Token for read/write operations
- `BLOB_READ_ONLY_TOKEN` - Token for read-only operations (optional)

**Verify Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Confirm `BLOB_READ_WRITE_TOKEN` exists
3. If missing, you can find it in Storage → Blob → Settings

### 3. Local Development Setup

For local development, create a `.env.local` file:

```bash
# Copy the token from Vercel Dashboard
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
```

**To get your token:**
1. Vercel Dashboard → Your Project → Storage → Blob
2. Click on your blob store
3. Go to **Settings** tab
4. Copy the `BLOB_READ_WRITE_TOKEN`

### 4. Test the Setup

After deployment, test the upload functionality:

1. **Access Admin Panel:**
   ```
   https://your-vercel-domain.vercel.app/admin/login
   Password: admin123
   ```

2. **Test File Upload:**
   - Go to "Add Generator"
   - Upload an image file
   - Check if it uploads successfully to Vercel Blob

### 5. Verify Blob Storage

**Check uploaded files:**
1. Vercel Dashboard → Your Project → Storage → Blob
2. Browse uploaded files
3. Verify URLs are working

## 📋 Troubleshooting

### Common Issues:

1. **"Missing BLOB_READ_WRITE_TOKEN" Error**
   - Ensure Blob storage is created in Vercel Dashboard
   - Check environment variables are set
   - Redeploy your project after adding variables

2. **"Upload failed" Error**
   - Check file size (max 4.5MB for hobby plan)
   - Verify file type (JPEG, PNG, GIF, WebP only)
   - Check browser console for detailed errors

3. **"Access denied" Error**
   - Verify token permissions
   - Ensure token is correctly set in environment variables

### Debug Commands:

```bash
# Check if Vercel CLI is linked
npx vercel whoami

# List your projects
npx vercel projects list

# Check environment variables
npx vercel env ls
```

## 🎯 Benefits of Vercel Blob

✅ **Seamless Integration** - Works perfectly with Vercel deployments
✅ **No Configuration** - Automatic setup with your Vercel project
✅ **Global CDN** - Fast file delivery worldwide
✅ **Generous Free Tier** - 1GB storage + 100GB bandwidth/month
✅ **Simple API** - Easy to use with @vercel/blob package
✅ **Automatic Scaling** - Handles traffic spikes automatically

## 📊 Pricing (as of 2024)

- **Hobby Plan**: 1GB storage + 100GB bandwidth/month (FREE)
- **Pro Plan**: 100GB storage + 1TB bandwidth/month
- **Enterprise**: Custom pricing

## 🔗 Useful Links

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [@vercel/blob NPM Package](https://www.npmjs.com/package/@vercel/blob)

---

## Next Steps After Setup

1. ✅ Create Vercel Blob storage
2. ✅ Verify environment variables
3. ✅ Deploy updated code
4. ✅ Test file upload functionality
5. ✅ Monitor usage in Vercel Dashboard
