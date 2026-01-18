# Database Migration Guide

Step-by-step instructions for running database migrations in Supabase.

## 📋 Migration Files (Run in Order)

1. `20260118105004_create_education_crm_schema.sql` - Core schema
2. `20260118110059_create_notification_system_tables.sql` - Notifications
3. `20260118111811_add_multi_tenancy_enhancements.sql` - Multi-tenancy
4. `20260118113637_fix_security_and_performance_issues.sql` - Security fixes
5. `20260118114526_remove_unused_indexes_and_fix_security.sql` - Final optimizations

## 🚀 Method 1: Supabase Dashboard (Recommended)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **lraqrtyalovuykeseaxn**

### Step 2: Open SQL Editor

1. In the left sidebar, click **SQL Editor**
2. Click **New query** (or the `+` button)

### Step 3: Run Each Migration

For each migration file, follow these steps:

1. **Open the migration file** from your local project:
   - File path: `supabase/migrations/[filename].sql`
   - Copy the entire contents

2. **Paste into SQL Editor**:
   - Paste the SQL code into the editor
   - Review the code (optional but recommended)

3. **Run the migration**:
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for "Success" message

4. **Verify**:
   - Check for any errors in the output
   - If successful, proceed to next migration

### Step 4: Run All Migrations in Order

**Migration 1: Core Schema**
```bash
# File: supabase/migrations/20260118105004_create_education_crm_schema.sql
# This creates: schools, user_profiles, roles, capabilities, students, parents, teachers, classes, attendance_records
```

**Migration 2: Notifications**
```bash
# File: supabase/migrations/20260118110059_create_notification_system_tables.sql
# This creates: notification templates, notification queue, notification preferences
```

**Migration 3: Multi-Tenancy**
```bash
# File: supabase/migrations/20260118111811_add_multi_tenancy_enhancements.sql
# This adds: school domains, tenant isolation policies
```

**Migration 4: Security Fixes**
```bash
# File: supabase/migrations/20260118113637_fix_security_and_performance_issues.sql
# This fixes: RLS policies, performance indexes
```

**Migration 5: Final Optimizations**
```bash
# File: supabase/migrations/20260118114526_remove_unused_indexes_and_fix_security.sql
# This removes: unused indexes, final security updates
```

## 🔧 Method 2: Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref lraqrtyalovuykeseaxn

# Run all migrations
supabase db push
```

## 📝 Quick Copy-Paste Method

### Option A: Copy Each File Individually

1. Open each `.sql` file in order
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Run
5. Repeat for next file

### Option B: Combine All Migrations (One-Time)

You can combine all migrations into one file, but **only if running for the first time**:

1. Open all 5 migration files
2. Copy contents in order
3. Paste all into SQL Editor (separated by `;`)
4. Run once

⚠️ **Warning**: Only do this for a fresh database. If migrations have been partially run, run them individually.

## ✅ Verification Checklist

After running all migrations, verify:

1. **Tables Created**:
   - Go to **Table Editor** in Supabase Dashboard
   - You should see: `schools`, `user_profiles`, `roles`, `capabilities`, `students`, `parents`, `teachers`, `classes`, `attendance_records`, `notifications`, etc.

2. **RLS Enabled**:
   - Go to **Authentication** → **Policies**
   - All tables should have Row Level Security enabled

3. **Test Connection**:
   ```bash
   npm run test-connection
   ```

## 🐛 Troubleshooting

### Error: relation already exists
**Cause**: Migration already run  
**Solution**: Skip that migration or drop the table if starting fresh

### Error: permission denied
**Cause**: Not using service role or RLS blocking  
**Solution**: 
- Use Supabase Dashboard (uses service role automatically)
- Or ensure you're connected with proper permissions

### Error: syntax error
**Cause**: SQL syntax issue  
**Solution**: 
- Check the migration file for syntax errors
- Run migrations one at a time to identify the problematic one

### Error: foreign key constraint
**Cause**: Dependencies not created  
**Solution**: Run migrations in the correct order (1-5)

## 📊 Expected Result

After all migrations:

- ✅ ~15+ tables created
- ✅ RLS policies enabled on all tables
- ✅ Indexes created for performance
- ✅ Functions and triggers created
- ✅ Multi-tenant isolation configured

## 🎯 Next Steps After Migrations

1. **Test Connection**:
   ```bash
   npm run test-connection
   ```

2. **Create Demo School** (if needed):
   - The `create-users` script will create one automatically
   - Or create manually in Supabase Dashboard

3. **Create Test Users**:
   ```bash
   npm run create-users
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

---

**Need help?** Check the migration files for comments explaining what each does.
