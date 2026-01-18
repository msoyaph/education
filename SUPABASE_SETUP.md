# Supabase Setup Guide

Your Supabase credentials have been configured. Follow these steps to complete the setup.

## ✅ Credentials Configured

- **Project URL**: `https://lraqrtyalovuykeseaxn.supabase.co`
- **Anon Key**: Configured in `.env`
- **Service Role Key**: Configured in `.env` (for admin operations)

## 📋 Setup Steps

### 1. Run Database Migrations

You need to apply the database migrations to your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn
2. Navigate to **SQL Editor**
3. Run each migration file in order:

   **Migration 1**: `supabase/migrations/20260118105004_create_education_crm_schema.sql`
   - Creates core tables (schools, user_profiles, roles, capabilities, etc.)

   **Migration 2**: `supabase/migrations/20260118110059_create_notification_system_tables.sql`
   - Creates notification system tables

   **Migration 3**: `supabase/migrations/20260118111811_add_multi_tenancy_enhancements.sql`
   - Adds multi-tenancy enhancements

   **Migration 4**: `supabase/migrations/20260118113637_fix_security_and_performance_issues.sql`
   - Fixes security and performance issues

   **Migration 5**: `supabase/migrations/20260118114526_remove_unused_indexes_and_fix_security.sql`
   - Final security and performance optimizations

### 2. Test Connection

Verify your connection works:

```bash
npm run test-connection
```

### 3. Create Test Users

After migrations are complete, create test users:

```bash
npm run create-users
```

This will create:
- Admin: `admin@admin.com` / `test1234`
- Teacher: `test@teacher.com` / `test1234`
- Parent: `test@parents.com` / `test1234`
- Student: `test@student.com` / `test1234`

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` and login with any test account.

## 🔒 Security Reminders

⚠️ **Important:**
- `.env` file is in `.gitignore` - it will NOT be committed
- Never share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- The service role key has full database access - keep it secret
- Only use service role key for admin scripts, never in client code

## 🧪 Testing the Setup

1. **Test Connection**:
   ```bash
   npm run test-connection
   ```

2. **Create Users**:
   ```bash
   npm run create-users
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

4. **Login Test**:
   - Go to `http://localhost:5173/login`
   - Use: `admin@admin.com` / `test1234`
   - Should redirect to `/admin` dashboard

## 📊 Verify Database

After running migrations, verify in Supabase Dashboard:

- **Tables**: Should see `schools`, `user_profiles`, `roles`, `capabilities`, etc.
- **RLS Policies**: Should be enabled on all tables
- **Functions**: Check for any custom functions

## 🐛 Troubleshooting

### Error: relation "schools" does not exist
**Solution**: Run the database migrations in Supabase SQL Editor

### Error: permission denied for table
**Solution**: 
- Check RLS policies are created
- Verify you're using the correct key (anon key for client, service role for admin)

### Error: Invalid API key
**Solution**: 
- Verify credentials in `.env` file
- Check Supabase Dashboard → Settings → API for correct keys

### Users not created
**Solution**:
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- Check Supabase logs for errors
- Verify `user_profiles` table exists

## 📝 Next Steps

1. ✅ Run database migrations
2. ✅ Test connection: `npm run test-connection`
3. ✅ Create users: `npm run create-users`
4. ✅ Start dev server: `npm run dev`
5. ✅ Test login with test accounts

---

**Your Supabase is configured and ready!** 🚀
