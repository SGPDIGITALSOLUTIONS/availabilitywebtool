# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
# Required: PostgreSQL connection string for Prisma
DATABASE_URL="postgresql://user:password@localhost:5432/clinic_availability?schema=public"

# Cron Secret (Optional but recommended)
# Used to protect the /api/cron/scrape endpoint
CRON_SECRET="your-secret-key-here"

# Local Development Login Credentials
# These are used to automatically create a default user for local development
# Only used if no users exist in the database
DEFAULT_USERNAME="admin"
DEFAULT_PASSWORD="admin123"
```

## Setup Steps

1. Copy the example above to `.env.local`
2. Update `DATABASE_URL` with your database connection string
3. Set `DEFAULT_USERNAME` and `DEFAULT_PASSWORD` for local development
4. Run `npm run seed-user` to create the default user
5. Or the user will be automatically created on first run if the database is empty

## Database Options

- **Vercel Postgres** (recommended) - Native Vercel integration
- **Supabase** - PostgreSQL with generous free tier
- **PlanetScale** - Serverless MySQL (update provider in schema.prisma)
- **Railway/Render** - Self-managed PostgreSQL

## Notes

- `.env.local` is gitignored and should not be committed
- Default credentials are only used for local development
- Change the default password after first login in production
