# GitHub Setup Guide

This guide will help you upload the Education CRM project to GitHub.

## Prerequisites

- Git installed on your system
- GitHub account
- Repository created at: https://github.com/msoyaph/education

## Step-by-Step Instructions

### 1. Initialize Git Repository (if not already initialized)

```bash
cd /Users/cliffsumalpong/Documents/School
git init
```

### 2. Add Remote Repository

```bash
git remote add origin https://github.com/msoyaph/education.git
```

### 3. Verify .gitignore

Make sure `.gitignore` is properly configured. It should exclude:
- `node_modules/`
- `.env` files
- `dist/` build folder
- IDE files
- OS files

### 4. Stage Files

```bash
# Review what will be committed
git status

# Add all files (respects .gitignore)
git add .
```

### 5. Create Initial Commit

```bash
git commit -m "Initial commit: Education CRM with DDD architecture

- Multi-tenant Education CRM system
- Role-based access control (Admin, Teacher, Parent, Student, IT, SuperAdmin)
- Domain-Driven Design architecture
- Attendance tracking module
- Notification system
- Complete UI implementation
- Production-ready codebase"
```

### 6. Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## Files Included

✅ **Included:**
- All source code (`src/`)
- Database migrations (`supabase/migrations/`)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation files (`.md` files)
- Scripts (`scripts/`)

❌ **Excluded (via .gitignore):**
- `node_modules/` - Dependencies
- `.env` - Environment variables (sensitive)
- `dist/` - Build output
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`)

## Post-Upload Checklist

After uploading, verify:

- [ ] Repository is accessible at https://github.com/msoyaph/education
- [ ] README.md displays correctly
- [ ] All source files are present
- [ ] No sensitive files (`.env`) are visible
- [ ] Documentation files are included

## Setting Up GitHub Secrets (Optional)

For CI/CD, add these secrets in GitHub Settings → Secrets:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

⚠️ **Never commit** `SUPABASE_SERVICE_ROLE_KEY` - it's too sensitive.

## Repository Settings

Recommended GitHub repository settings:

1. **Settings → General**
   - Description: "Modern multi-tenant Education CRM system"
   - Topics: `education`, `crm`, `react`, `typescript`, `supabase`, `multi-tenant`

2. **Settings → Actions → General**
   - Enable GitHub Actions
   - Allow all actions

3. **Settings → Pages** (if deploying)
   - Source: GitHub Actions

## Next Steps

1. **Clone on other machines:**
   ```bash
   git clone https://github.com/msoyaph/education.git
   cd education
   npm install
   ```

2. **Create `.env` file** (not committed):
   ```env
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```

3. **Run migrations** in Supabase dashboard

4. **Create test users:**
   ```bash
   npm run create-users
   ```

## Troubleshooting

### Error: remote origin already exists
```bash
git remote remove origin
git remote add origin https://github.com/msoyaph/education.git
```

### Error: failed to push
```bash
# If repository has existing content
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Check what will be committed
```bash
git status
git diff --cached
```

## Security Reminders

⚠️ **Before pushing, verify:**
- [ ] No `.env` files in repository
- [ ] No API keys in code
- [ ] No service role keys committed
- [ ] `.gitignore` is working correctly

Check with:
```bash
git ls-files | grep -E '\.env|service.*key|secret'
```

If any sensitive files are listed, remove them:
```bash
git rm --cached .env
git commit -m "Remove sensitive files"
```

---

**Ready to push!** Follow the steps above to upload your code to GitHub.
