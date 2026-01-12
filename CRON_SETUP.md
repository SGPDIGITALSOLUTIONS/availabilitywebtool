# Vercel Cron Jobs Setup Guide

## Overview

Your project is already configured with cron jobs in `vercel.json`. The cron jobs will automatically run on Vercel after deployment.

## Current Configuration

Your `vercel.json` includes:
- **Scrape Job**: Runs every hour (`0 * * * *`) at `/api/cron/scrape`
- **Health Check**: Runs daily at midnight (`0 0 * * *`) at `/api/health`

## Setup Steps

### 1. Deploy to Vercel

The cron jobs are automatically activated when you deploy. No additional installation is needed - Vercel handles cron jobs natively.

### 2. Set Environment Variables (Optional but Recommended)

For security, you can set a cron secret. Vercel automatically creates and manages `VERCEL_CRON_SECRET`, but you can also set a custom one:

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add `VERCEL_CRON_SECRET` (Vercel sets this automatically) OR `CRON_SECRET` (for manual testing)
3. Set a secure random string as the value
4. Apply to **Production**, **Preview**, and **Development** environments
5. **Redeploy** your project

### 3. Verify Cron Jobs Are Active

After deployment:
1. Go to your Vercel project dashboard
2. Click on **Settings** → **Cron Jobs**
3. You should see your cron jobs listed:
   - `/api/cron/scrape` - Hourly
   - `/api/health` - Daily

### 4. Test the Cron Endpoint Manually

You can test the endpoint manually by calling it with the secret:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/scrape
```

Or if `VERCEL_CRON_SECRET` is set, Vercel will automatically include it when triggering the cron job.

## How It Works

1. **Vercel automatically triggers** the cron jobs based on the schedule in `vercel.json`
2. **Vercel sends an Authorization header** with `VERCEL_CRON_SECRET` (if set)
3. **Your endpoint verifies** the authorization header matches the secret
4. **The scrape runs** and updates the database cache
5. **Users see cached data** instantly when they visit the dashboard

## Troubleshooting

### Cron Jobs Not Running

- Check that your project is deployed (cron jobs only work on deployed projects)
- Verify the cron jobs appear in Vercel dashboard → Settings → Cron Jobs
- Check Vercel function logs for errors

### Authorization Errors

- Ensure `VERCEL_CRON_SECRET` is set in Vercel environment variables
- The secret is automatically included by Vercel - you don't need to set it manually
- For manual testing, you can use `CRON_SECRET` instead

### Function Timeout

- Cron scrape jobs have a 300-second (5-minute) timeout (configured in `vercel.json`)
- If scraping takes longer, consider optimizing or splitting into multiple jobs

## Plan Limitations

- **Hobby (Free) Plan**: Up to 2 cron jobs, each triggered once per day maximum
- **Pro Plan**: More cron jobs and more frequent triggers
- Your current config has 2 cron jobs, which is fine for the free plan, but the hourly scrape might need to be adjusted to daily on the free plan

## Next Steps

1. Deploy your project to Vercel
2. Verify cron jobs appear in the Vercel dashboard
3. Check the logs after the first cron run to ensure it's working
4. Monitor the database to see cached data being updated
