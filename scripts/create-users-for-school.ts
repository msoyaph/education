/**
 * Script to create/update users for a specific school
 * 
 * Usage: npx tsx scripts/create-users-for-school.ts
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  console.error('Set them in your .env file or export them:');
  console.error('  export SUPABASE_URL="your-url"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface UserInfo {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'admin' | 'teacher' | 'parent' | 'student';
  userId?: string; // Optional: if user ID is known
}

// Target school ID - if not found, will use first available school or create one
const TARGET_SCHOOL_ID = '7e2812af-5a16-441b-baf3-9a3b89212991';

const users: UserInfo[] = [
  {
    email: 'admin@admin.com',
    password: 'test1234',
    firstName: 'Admin',
    lastName: 'User',
    userType: 'admin',
  },
  {
    email: 'test@teacher.com',
    password: 'test1234',
    firstName: 'Test',
    lastName: 'Teacher',
    userType: 'teacher',
    userId: '9c5ccd7b-f029-4188-965d-d5b36592715f',
  },
  {
    email: 'test@parents.com',
    password: 'test1234',
    firstName: 'Test',
    lastName: 'Parent',
    userType: 'parent',
    userId: 'e7717320-9f28-41d9-a117-97b885f0d4af',
  },
  {
    email: 'test@student.com',
    password: 'test1234',
    firstName: 'Test',
    lastName: 'Student',
    userType: 'student',
    userId: 'c23f2200-4664-45bf-adec-41a9668e1b0f',
  },
];

async function getOrUseSchool(desiredSchoolId: string): Promise<string> {
  // First, check if desired school exists
  const { data: desiredSchool, error: checkError } = await supabase
    .from('schools')
    .select('id, name, code')
    .eq('id', desiredSchoolId)
    .maybeSingle();

  if (!checkError && desiredSchool) {
    console.log(`✓ Found desired school: ${desiredSchool.name} (${desiredSchool.code || 'no code'})`);
    return desiredSchool.id;
  }

  // If desired school doesn't exist, list all schools
  console.log(`⚠️  Desired school ID not found: ${desiredSchoolId}`);
  console.log(`   Looking for existing schools...`);

  const { data: allSchools, error: listError } = await supabase
    .from('schools')
    .select('id, name, code')
    .order('created_at', { ascending: false })
    .limit(10);

  if (listError) {
    console.error(`✗ Error listing schools:`, listError.message);
    throw listError;
  }

  if (!allSchools || allSchools.length === 0) {
    console.error(`✗ No schools found in database. Please create a school first.`);
    throw new Error('No schools available');
  }

  // Use first available school
  const schoolToUse = allSchools[0];
  console.log(`✓ Using existing school: ${schoolToUse.name} (${schoolToUse.code || 'no code'})`);
  console.log(`  School ID: ${schoolToUse.id}`);
  
  if (allSchools.length > 1) {
    console.log(`\n⚠️  Note: There are ${allSchools.length} schools in the database.`);
    console.log(`   Using the first one. To use a different school, update TARGET_SCHOOL_ID in the script.`);
  }

  return schoolToUse.id;
}

async function createOrUpdateUser(user: UserInfo, schoolId: string): Promise<string> {
  console.log(`\nProcessing user: ${user.email} (${user.userType})...`);

  let userId: string;

  // If user ID is provided, check if that user exists
  if (user.userId) {
    try {
      const { data: existingAuthUser, error: getUserError } = await supabase.auth.admin.getUserById(user.userId);
      
      if (!getUserError && existingAuthUser?.user) {
        console.log(`  ✓ Found existing auth user with provided ID: ${user.userId}`);
        userId = user.userId;
      } else {
        console.log(`  ⚠️  Provided user ID not found, will search by email instead`);
        user.userId = undefined; // Clear invalid ID
      }
    } catch (error: any) {
      console.log(`  ⚠️  Error checking user ID: ${error.message || error}, will search by email instead`);
      user.userId = undefined; // Clear invalid ID
    }
  }

  // If no valid user ID, search by email
  if (!userId) {
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`  ✗ Error listing users:`, listError.message);
      throw listError;
    }

    const existingAuthUser = usersList?.users?.find(u => u.email === user.email);
    
    if (existingAuthUser && existingAuthUser.id) {
      console.log(`  ⚠️  User already exists in auth, using existing ID: ${existingAuthUser.id}`);
      userId = existingAuthUser.id;
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        console.error(`  ✗ Error creating auth user:`, authError.message);
        throw authError;
      }

      userId = authData.user.id;
      console.log(`  ✓ Auth user created: ${userId}`);
    }
  }

  // Update password if needed
  const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(userId, {
    password: user.password,
  });

  if (updatePasswordError) {
    console.warn(`  ⚠️  Warning: Could not update password:`, updatePasswordError.message);
  } else {
    console.log(`  ✓ Password set/updated`);
  }

  // Check if user profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, email, user_type, school_id')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    console.log(`  ⚠️  User profile already exists`);
    console.log(`     Current school_id: ${existingProfile.school_id}`);
    console.log(`     Current user_type: ${existingProfile.user_type}`);
    
    // Update profile with correct school_id and user_type
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        user_type: user.userType,
        school_id: schoolId,
        is_active: true,
      })
      .eq('id', userId);

    if (updateError) {
      console.error(`  ✗ Error updating profile:`, updateError.message);
      throw updateError;
    }
    
    console.log(`  ✓ User profile updated (school_id: ${schoolId})`);
  } else {
    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        school_id: schoolId,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        user_type: user.userType,
        is_active: true,
      });

    if (profileError) {
      console.error(`  ✗ Error creating profile:`, profileError.message);
      throw profileError;
    }

    console.log(`  ✓ User profile created (school_id: ${schoolId})`);
  }

  return userId;
}

async function main() {
  console.log('🚀 Creating/updating users for school...\n');
  console.log(`School ID: ${TARGET_SCHOOL_ID}\n`);

  try {
    // Get or use school
    const schoolId = await getOrUseSchool(TARGET_SCHOOL_ID);

    // Process all users
    const createdUsers: Array<{ email: string; userId: string; userType: string }> = [];
    for (const user of users) {
      const userId = await createOrUpdateUser(user, schoolId);
      createdUsers.push({
        email: user.email,
        userId,
        userType: user.userType,
      });
    }

    console.log('\n✅ All users processed successfully!');
    console.log('\n📋 User Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ROLE      | EMAIL                  | USER ID');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    createdUsers.forEach((u) => {
      console.log(`${u.userType.toUpperCase().padEnd(10)} | ${u.email.padEnd(22)} | ${u.userId}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📌 All users are linked to school: ${schoolId}`);
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach((user) => {
      console.log(`${user.userType.toUpperCase().padEnd(10)} | ${user.email.padEnd(22)} | ${user.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('\n❌ Error processing users:', error);
    process.exit(1);
  }
}

main();
