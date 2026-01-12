# Fixing Chromium libnss3.so Error on Vercel

## The Problem

You're seeing this error:
```
Failed to launch the browser process: Code: 127
stderr: /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

This happens because Vercel's serverless environment doesn't have all the required system libraries for Chromium.

## The Solution

### Step 1: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Set:
   - **Key**: `AWS_LAMBDA_JS_RUNTIME`
   - **Value**: `nodejs22.x`
5. Select all environments (Production, Preview, Development)
6. Click **Save**
7. **Redeploy your project** (this is critical!)

### Step 2: Verify the Fix

After redeploying, the error should be resolved. The `nodejs22.x` runtime includes the necessary system libraries that Chromium needs.

## Why This Works

Vercel uses AWS Lambda under the hood. The `AWS_LAMBDA_JS_RUNTIME` environment variable tells Vercel to use Node.js 22.x runtime, which includes all the required shared libraries (like `libnss3.so`) that Chromium needs to run.

## Alternative: If the Error Persists

If setting `AWS_LAMBDA_JS_RUNTIME` doesn't work, try:

1. **Check your Node.js version** in `package.json` - ensure it's compatible
2. **Update `@sparticuz/chromium`** to the latest version:
   ```bash
   npm install @sparticuz/chromium@latest
   ```
3. **Check Vercel logs** for more detailed error messages

## Current Configuration

The code is already configured to:
- Use `@sparticuz/chromium` for Vercel deployments
- Set `setGraphicsMode = false` (required for serverless)
- Use proper Chromium launch arguments
- Add additional serverless-friendly args

The only missing piece is the environment variable!
