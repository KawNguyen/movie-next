# 🚨 URGENT: Vercel Environment Variables Fix

## Problem
User logged in nhưng vẫn bị redirect to login khi access "Lịch sử xem" trên production.

## Root Cause
Environment variables trên Vercel không đúng, đặc biệt là `BETTER_AUTH_URL`.

## IMMEDIATE ACTION REQUIRED

### 1. Set Environment Variables trên Vercel Dashboard:

**Go to: Project Settings → Environment Variables**

```bash
BETTER_AUTH_URL=https://YOUR-ACTUAL-VERCEL-DOMAIN.vercel.app
NEXT_PUBLIC_APP_URL=https://YOUR-ACTUAL-VERCEL-DOMAIN.vercel.app
DATABASE_URL=postgresql://neondb_owner:npg_lCIoWFy5KpD6@ep-quiet-firefly-a1j1i8cr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
BETTER_AUTH_SECRET=SQnUskYm8tojdlVWfyZTVIvJTQaln2qY
NEXT_PUBLIC_API_URL=https://phimapi.com
NEXT_PUBLIC_API_IMAGE_URL=https://phimimg.com
```

**CRITICAL**: Replace `YOUR-ACTUAL-VERCEL-DOMAIN` với domain thật của bạn!

### 2. Debug Tools Added:

- **`/api/debug/session`** - Check session status
- **SessionDebug component** - Shows authentication mismatch
- **Enhanced middleware logging** - Logs authentication issues

### 3. After Setting Env Vars:

1. **Redeploy** your application
2. **Clear browser cookies** for the domain
3. **Login again**
4. **Test "Lịch sử xem"**

### 4. If Still Not Working:

1. Visit `/api/debug/session` on your production domain
2. Check browser console for middleware logs
3. Look for SessionDebug component in bottom-right corner

## Expected Fix:
✅ No more redirect to login after setting correct BETTER_AUTH_URL
✅ Session persists across protected pages  
✅ Authentication works properly on production

## Technical Changes Made:
- Enhanced cookie handling for production
- Better trusted origins configuration
- Explicit cookie domain settings
- Debug API endpoints
- Enhanced middleware logging

**Action Required: Set environment variables và redeploy ngay!** 🚀
