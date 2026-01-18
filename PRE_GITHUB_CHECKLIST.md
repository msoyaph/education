# Pre-GitHub Upload Checklist

Use this checklist before uploading to GitHub to ensure everything is properly configured.

## ✅ Security Checks

- [x] `.env` file exists and is in `.gitignore`
- [x] No API keys hardcoded in source files
- [x] No service role keys in code
- [x] `.gitignore` properly configured
- [x] Sensitive files excluded

## ✅ Documentation

- [x] `README.md` created with project overview
- [x] `CONTRIBUTING.md` created
- [x] `GITHUB_SETUP.md` created with upload instructions
- [x] All documentation files present

## ✅ Project Configuration

- [x] `package.json` updated with proper name and description
- [x] All dependencies listed in `package.json`
- [x] Scripts configured correctly
- [x] TypeScript configuration files present

## ✅ Code Quality

- [x] TypeScript compiles without errors (`npm run typecheck`)
- [x] Linter passes (`npm run lint`)
- [x] No console errors in code
- [x] All imports resolved

## ✅ Git Configuration

- [ ] Git repository initialized (`git init`)
- [ ] Remote added (`git remote add origin https://github.com/msoyaph/education.git`)
- [ ] Files staged (`git add .`)
- [ ] Initial commit created
- [ ] Ready to push

## ✅ Files to Include

- [x] All source code (`src/`)
- [x] Database migrations (`supabase/migrations/`)
- [x] Configuration files
- [x] Documentation files
- [x] Scripts (`scripts/`)
- [x] GitHub workflows (`.github/`)

## ✅ Files to Exclude (via .gitignore)

- [x] `node_modules/`
- [x] `.env` and `.env.*`
- [x] `dist/` build folder
- [x] IDE files (`.vscode/`, `.idea/`)
- [x] OS files (`.DS_Store`)

## Quick Commands

```bash
# Initialize git (if not done)
git init

# Add remote
git remote add origin https://github.com/msoyaph/education.git

# Check what will be committed
git status

# Verify .env is ignored
git check-ignore .env

# Stage files
git add .

# Create commit
git commit -m "Initial commit: Education CRM"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Verification Commands

```bash
# Check for sensitive files
find . -name ".env*" -not -path "./node_modules/*"

# Check for secrets in code
grep -r "SERVICE_ROLE_KEY" --include="*.ts" --include="*.tsx" . | grep -v node_modules

# Verify .gitignore
cat .gitignore | grep -E "\.env|node_modules|dist"
```

## After Upload

1. Verify repository is accessible
2. Check README displays correctly
3. Verify no sensitive files are visible
4. Test cloning the repository
5. Set up GitHub Actions secrets (if using CI/CD)

---

**Ready when all items are checked!** 🚀
