# Create Test Users Guide

This guide explains how to create test user accounts for the Education CRM.

## Quick Start

1. **Set up environment variables** (see below)
2. **Run the script**: `npm run create-users`

## Environment Variables Required

Create a `.env` file in the project root with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (⚠️ Keep this secret!) → `SUPABASE_SERVICE_ROLE_KEY`

**Important**: Use the `service_role` key, not the `anon` key. The service role key has admin privileges needed to create users.

## Users Created

The script will create these test accounts:

| Role    | Email              | Password | Dashboard Route |
|---------|-------------------|----------|-----------------|
| Admin   | admin@admin.com   | test1234 | `/admin`        |
| Teacher | test@teacher.com  | test1234 | `/teacher`      |
| Parent  | test@parents.com  | test1234 | `/parent`      |
| Student | test@student.com   | test1234 | `/student`     |

## What the Script Does

1. **Creates or uses a demo school** (`demo-school`)
   - If a school with code `demo-school` exists, it uses that
   - Otherwise, creates a new "Demo School"

2. **Creates auth users** in Supabase Auth
   - Uses Supabase Admin API to create users
   - Auto-confirms email (no verification needed)
   - Sets passwords

3. **Creates user profiles** in the `user_profiles` table
   - Links users to the demo school
   - Sets user types (admin, teacher, parent, student)
   - Sets names and active status

4. **Handles existing users**
   - If a user already exists, updates their password and profile
   - Safe to run multiple times

## Running the Script

```bash
npm run create-users
```

Or directly:

```bash
npx tsx scripts/create-test-users.ts
```

## Expected Output

```
🚀 Creating test users...

✓ Using existing school: Demo School (uuid-here)

Creating user: admin@admin.com (admin)...
  ✓ Auth user created: uuid-here
  ✓ User profile created

Creating user: test@teacher.com (teacher)...
  ✓ Auth user created: uuid-here
  ✓ User profile created

Creating user: test@parents.com (parent)...
  ✓ Auth user created: uuid-here
  ✓ User profile created

Creating user: test@student.com (student)...
  ✓ Auth user created: uuid-here
  ✓ User profile created

✅ All test users created successfully!

📋 Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN      | admin@admin.com      | test1234
TEACHER    | test@teacher.com      | test1234
PARENT     | test@parents.com     | test1234
STUDENT    | test@student.com     | test1234
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

### Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required

**Solution**: Make sure you've created a `.env` file in the project root with the required variables.

### Error: permission denied for table user_profiles

**Solution**: 
- Make sure you're using the `service_role` key, not the `anon` key
- The service role key bypasses RLS policies

### Error: duplicate key value violates unique constraint

**Solution**: This is normal if users already exist. The script will update existing users instead of creating new ones.

### Error: Failed to create auth user

**Possible causes**:
- Invalid service role key
- Email already exists (script will handle this)
- Network connectivity issues

**Solution**: Check your Supabase credentials and network connection.

## Testing the Users

After creating users, you can test login:

1. Start the dev server: `npm run dev`
2. Navigate to `/login`
3. Use any of the test credentials above
4. You should be redirected to the appropriate dashboard based on role

## Security Notes

⚠️ **Important**: 
- These are test accounts with weak passwords
- **Never use these in production**
- The service role key has full database access - keep it secret
- Add `.env` to `.gitignore` (should already be there)

## Next Steps

After creating users, you may want to:
- Create test classes and enrollments
- Create test attendance records
- Link parents to students
- Add test notifications

See the main README for more information.
