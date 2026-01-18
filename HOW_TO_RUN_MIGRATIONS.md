# How to Run Database Migrations

## Quick Steps

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn
- Click **SQL Editor** in the left sidebar
- Click **New query**

### 2. Run Migrations One by One

Run these files **in this exact order**:

#### Migration 1: Core Schema
- Open: `supabase/migrations/20260118105004_create_education_crm_schema.sql`
- Copy ALL contents
- Paste into SQL Editor
- Click **Run** (or press Cmd+Enter)
- Wait for "Success" message

#### Migration 2: Notifications
- Open: `supabase/migrations/20260118110059_create_notification_system_tables.sql`
- Copy ALL contents
- Paste into SQL Editor
- Click **Run**

#### Migration 3: Multi-Tenancy
- Open: `supabase/migrations/20260118111811_add_multi_tenancy_enhancements.sql`
- Copy ALL contents
- Paste into SQL Editor
- Click **Run**

#### Migration 4: Security Fixes
- Open: `supabase/migrations/20260118113637_fix_security_and_performance_issues.sql`
- Copy ALL contents
- Paste into SQL Editor
- Click **Run**

#### Migration 5: Final Optimizations
- Open: `supabase/migrations/20260118114526_remove_unused_indexes_and_fix_security.sql`
- Copy ALL contents
- Paste into SQL Editor
- Click **Run**

### 3. Verify

After all migrations:
1. Go to **Table Editor** in Supabase Dashboard
2. You should see tables like: `schools`, `user_profiles`, `roles`, `students`, etc.

## Visual Guide

```
Supabase Dashboard
  └─ SQL Editor
      └─ New Query
          └─ [Paste Migration 1] → Run
          └─ [Paste Migration 2] → Run
          └─ [Paste Migration 3] → Run
          └─ [Paste Migration 4] → Run
          └─ [Paste Migration 5] → Run
```

## Alternative: Combine All (First Time Only)

If this is a **fresh database** with no existing tables:

1. Open all 5 migration files
2. Copy contents in order (Migration 1, then 2, then 3, etc.)
3. Paste all into SQL Editor (separated by `;`)
4. Run once

⚠️ **Only do this if database is empty!**

## Troubleshooting

**Error: "relation already exists"**
- That migration already ran - skip it

**Error: "permission denied"**
- Make sure you're in Supabase Dashboard (uses admin access)

**Error: "syntax error"**
- Check which migration failed
- Run them one at a time to identify the issue

## After Migrations

Test your setup:
```bash
npm run test-connection
npm run create-users
npm run dev
```

---

**That's it!** Run each migration file in order through the Supabase SQL Editor.
