# Vercel Deployment Checklist

Quick checklist before deploying to Vercel.

## Pre-Deployment Checklist

### ✅ Code Ready
- [ ] All changes committed to git
- [ ] Code pushed to repository
- [ ] No build errors (`npm run build` succeeds)
- [ ] Type checking passes (`npm run typecheck`)

### ✅ Configuration Files
- [x] `vercel.json` created and configured
- [x] `.env` is in `.gitignore`
- [x] `dist/` is in `.gitignore`
- [x] Environment variables documented

### ✅ Environment Variables (Set in Vercel)
- [ ] `VITE_SUPABASE_URL` added to Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` added to Vercel
- [ ] Variables added to Production environment
- [ ] Variables added to Preview environment
- [ ] Variables added to Development environment

### ✅ Supabase Setup
- [ ] Database migrations applied
- [ ] RLS (Row Level Security) policies active
- [ ] Test users created (optional)
- [ ] Supabase project is active

### ✅ Security
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT in frontend code
- [ ] `.env` file is NOT committed
- [ ] Only public keys in Vercel environment variables

## Deployment Steps

### 1. Connect to Vercel
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New Project"
- [ ] Import your Git repository

### 2. Configure Project
- [ ] Framework: Vite (auto-detected)
- [ ] Build Command: `npm run build` (auto-detected)
- [ ] Output Directory: `dist` (auto-detected)

### 3. Add Environment Variables
- [ ] Go to Project Settings → Environment Variables
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Select all environments (Production, Preview, Development)

### 4. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete
- [ ] Check build logs for errors

### 5. Verify
- [ ] Visit deployment URL
- [ ] Test home page loads
- [ ] Test login page works
- [ ] Test authentication flow
- [ ] Test protected routes
- [ ] Check browser console for errors

## Post-Deployment

### ✅ Testing
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Dashboard routes work
- [ ] API calls to Supabase succeed
- [ ] No console errors

### ✅ Performance
- [ ] Page loads quickly (< 3 seconds)
- [ ] Assets are cached properly
- [ ] No 404 errors for routes

## Troubleshooting

If deployment fails:

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Test build locally**: `npm run build`
4. **Check Supabase** is accessible and migrations are applied
5. **Verify `vercel.json`** is in project root

## Quick Reference

**Deployment URLs:**
- Production: `education-lac-six.vercel.app`
- Preview: `education-il05o7i5e-nexscouts-projects.vercel.app`

**Environment Variables Needed:**
- `VITE_SUPABASE_URL` (from Supabase dashboard)
- `VITE_SUPABASE_ANON_KEY` (from Supabase dashboard)

**Get Supabase Credentials:**
https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn/settings/api

---

✅ **Ready to deploy!** Follow the checklist above.
