# Fixing Chromium libnss3.so Error on Vercel

## The Problem

You're seeing this error:
```
Failed to launch the browser process: Code: 127
stderr: /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

This happens because Vercel's serverless environment doesn't have all the required system libraries for Chromium, even though you're using Node.js 22.

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

### Step 2: Verify the Environment Variable is Set

After redeploying, check the error response in your browser console. You should see:
```json
{
  "debug": {
    "awsLambdaRuntime": "nodejs22.x",  // Should NOT say "NOT SET"
    ...
  }
}
```

If it says `"NOT SET"`, the environment variable wasn't applied correctly. Try:
- Double-check the variable name is exactly `AWS_LAMBDA_JS_RUNTIME` (case-sensitive)
- Make sure you selected all environments
- Try redeploying again
- Check Vercel logs to see if the variable is being read

### Step 3: Alternative - Check Vercel Function Logs

If the environment variable is set but still not working:
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on a failed function execution
3. Check the logs for the `🔧 [Scraper] Environment check:` log
4. Verify `awsLambdaRuntime` shows `nodejs22.x`

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
