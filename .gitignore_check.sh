#!/bin/bash
echo "Checking for sensitive files..."
echo ""

# Check for .env files
if find . -name ".env*" -not -path "./node_modules/*" | grep -q .; then
  echo "⚠️  Found .env files (should be in .gitignore):"
  find . -name ".env*" -not -path "./node_modules/*"
else
  echo "✓ No .env files found"
fi

echo ""

# Check for common secrets
if grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -q .; then
  echo "⚠️  Found SUPABASE_SERVICE_ROLE_KEY in code files"
else
  echo "✓ No service role keys in code"
fi

echo ""
echo "Checking .gitignore..."
if [ -f .gitignore ]; then
  echo "✓ .gitignore exists"
  if grep -q "^\.env" .gitignore; then
    echo "✓ .env is in .gitignore"
  else
    echo "⚠️  .env not found in .gitignore"
  fi
else
  echo "⚠️  .gitignore not found"
fi
