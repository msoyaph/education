# Create Test Users Script

This script creates test user accounts for development and testing.

## Prerequisites

1. **Supabase Service Role Key**: You need the service role key (not the anon key) to create users via the Admin API.

   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the `service_role` key (⚠️ Keep this secret!)

2. **Environment Variables**: Create a `.env` file in the project root or export the variables:

```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Or export them:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Usage

Run the script:

```bash
npm run create-users
```

Or directly:

```bash
npx tsx scripts/create-test-users.ts
```

## Created Users

The script will create the following test users:

| Role    | Email              | Password |
|---------|-------------------|----------|
| Admin   | admin@admin.com   | test1234 |
| Teacher | test@teacher.com  | test1234 |
| Parent  | test@parents.com  | test1234 |
| Student | test@student.com   | test1234 |

## What the Script Does

1. **Creates or uses a demo school** (`demo-school`)
2. **Creates auth users** in Supabase Auth
3. **Creates user profiles** in the `user_profiles` table
4. **Links users to the demo school**

## Notes

- If users already exist, the script will update their passwords and profiles
- All users are created with email confirmation (no need to verify)
- Users are linked to a demo school for multi-tenant testing

## Troubleshooting

**Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required**
- Make sure you've set the environment variables (see Prerequisites)

**Error: permission denied for table user_profiles**
- Make sure you're using the service role key, not the anon key
- The service role key bypasses RLS policies

**Error: duplicate key value violates unique constraint**
- User already exists, script will update instead of create
