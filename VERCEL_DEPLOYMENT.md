# Vercel Deployment Guide

This guide walks you through deploying the Education CRM to Vercel.

## Prerequisites

- ✅ Code pushed to GitHub (or GitLab/Bitbucket)
- ✅ Supabase project set up with migrations applied
- ✅ Environment variables ready

## Deployment URLs

Your deployment URLs:
- **Production**: `education-lac-six.vercel.app`
- **Preview**: `education-il05o7i5e-nexscouts-projects.vercel.app`

## Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository:
   - Select **GitHub** (or GitLab/Bitbucket)
   - Choose your repository
   - Click **"Import"**

## Step 2: Configure Build Settings

Vercel will auto-detect Vite settings. Verify these settings:

- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

✅ These are automatically configured via `vercel.json`

## Step 3: Add Environment Variables

### Required Environment Variables

Go to **Project Settings** → **Environment Variables** and add:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://lraqrtyalovuykeseaxn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGci...` |

### Where to Get These Values

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn/settings/api)
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Add Variables to Vercel

1. In Vercel project settings, go to **Environment Variables**
2. Click **"Add New"**
3. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase URL
   - **Environment**: Select `Production`, `Preview`, and `Development`
4. Repeat for `VITE_SUPABASE_ANON_KEY`

⚠️ **Important**: Add variables to all environments (Production, Preview, Development)

## Step 4: Deploy

### Option A: Automatic Deployment (Recommended)

1. Push your code to the main branch:
   ```bash
   git push origin main
   ```

2. Vercel will automatically:
   - Trigger a new deployment
   - Install dependencies
   - Build the project
   - Deploy to production

### Option B: Manual Deployment

1. Click **"Deploy"** button in Vercel dashboard
2. Wait for build to complete (~1-2 minutes)
3. Visit your deployment URL

## Step 5: Verify Deployment

### Check Build Logs

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Check **Build Logs** for any errors

### Test the Application

Visit your deployment URL:
- Production: `https://education-lac-six.vercel.app`
- Preview: `https://education-il05o7i5e-nexscouts-projects.vercel.app`

Test:
- ✅ Home page loads
- ✅ Login page works
- ✅ Can sign in with test users
- ✅ Dashboards load correctly

## Step 6: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `app.yourschool.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

## Configuration Files

### `vercel.json`

This file configures:
- Build settings
- SPA routing (rewrites all routes to `index.html`)
- Cache headers for static assets

✅ Already configured and ready to use

### Environment Variables

**Never commit these to git:**
- `VITE_SUPABASE_URL` ✅ (set in Vercel)
- `VITE_SUPABASE_ANON_KEY` ✅ (set in Vercel)

**Never add to Vercel (client-side):**
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (server-side only, never in frontend)

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Environment variable not found"**
- Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- Check that variables are added to the correct environment

**Error: "Build command failed"**
- Check build logs for specific error
- Try building locally: `npm run build`

### App Doesn't Work After Deployment

**Error: "Supabase connection failed"**
- Verify environment variables are set correctly in Vercel
- Check Supabase project is active and accessible
- Test with: `npm run test-connection`

**Routes return 404**
- Verify `vercel.json` is in the project root
- Check that `rewrites` configuration is correct
- All routes should redirect to `/index.html` for SPA routing

**CORS errors**
- Check Supabase project settings allow your Vercel domain
- Go to Supabase → Settings → API → Add your Vercel URL to allowed origins

### Performance Issues

**Slow initial load**
- Enable Vercel's Edge Network (automatic)
- Check build output size in deployment logs
- Consider code splitting if bundle is large

## Continuous Deployment

Once connected, Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches and PRs

Each deployment gets a unique URL for testing.

## Rollback Deployment

1. Go to **Deployments** tab
2. Find the previous working deployment
3. Click **"⋯"** (three dots)
4. Select **"Promote to Production"**

## Security Checklist

Before deploying:

- ✅ Environment variables are set in Vercel (not committed)
- ✅ `.env` is in `.gitignore`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is NOT in frontend code
- ✅ Only `VITE_SUPABASE_ANON_KEY` is used in client
- ✅ RLS (Row Level Security) is enabled in Supabase

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Supabase Docs**: https://supabase.com/docs

---

**Ready to deploy!** 🚀

Push your code and Vercel will automatically build and deploy your application.
