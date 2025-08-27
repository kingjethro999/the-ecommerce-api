# Ecommerce Pro API - Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Render.com account (or your preferred hosting provider)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=production
PORT=8000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
RESEND_API_KEY=your_resend_api_key  # For email functionality
```

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Generate Prisma client:
   ```bash
   pnpm prisma generate
   ```

3. Run migrations:
   ```bash
   pnpm prisma migrate deploy
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Production Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following build settings:
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm start`
4. Add environment variables from your `.env` file
5. Deploy!

## Database Setup

1. Create a new PostgreSQL database
2. Run migrations:
   ```bash
   pnpm prisma migrate deploy
   ```

## Troubleshooting

- If you see `@prisma/client did not initialize yet`, make sure to run `pnpm prisma generate`
- Check the logs in your hosting provider for any errors
- Ensure all environment variables are properly set in production
