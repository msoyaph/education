/**
 * Script to create test users for development
 * 
 * Usage: npm run create-users
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

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'admin' | 'teacher' | 'parent' | 'student';
}

const testUsers: TestUser[] = [
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
  },
  {
    email: 'test@parents.com',
    password: 'test1234',
    firstName: 'Test',
    lastName: 'Parent',
    userType: 'parent',
  },
  {
    email: 'test@student.com',
    password: 'test1234',
    firstName: 'Test',
    lastName: 'Student',
    userType: 'student',
  },
];

async function getOrCreateDemoSchool() {
  // Check if demo school exists
  const { data: existingSchool } = await supabase
    .from('schools')
    .select('id, name')
    .eq('code', 'demo-school')
    .maybeSingle();

  if (existingSchool) {
    console.log(`✓ Using existing school: ${existingSchool.name} (${existingSchool.id})`);
    return existingSchool.id;
  }

  // Create demo school
  const { data: newSchool, error } = await supabase
    .from('schools')
    .insert({
      name: 'Demo School',
      code: 'demo-school',
      email: 'demo@school.com',
      is_active: true,
    })
    .select('id, name')
    .single();

  if (error) {
    console.error('Error creating demo school:', error);
    throw error;
  }

  console.log(`✓ Created demo school: ${newSchool.name} (${newSchool.id})`);
  return newSchool.id;
}

async function createUser(user: TestUser, schoolId: string) {
  console.log(`\nCreating user: ${user.email} (${user.userType})...`);

  // Check if user already exists
  const { data: existingAuthUser } = await supabase.auth.admin.getUserByEmail(user.email);
  
  let userId: string;

  if (existingAuthUser?.user) {
    console.log(`  ⚠️  User already exists in auth, using existing ID: ${existingAuthUser.user.id}`);
    userId = existingAuthUser.user.id;
    
    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: user.password,
    });
    
    if (updateError) {
      console.error(`  ✗ Error updating password:`, updateError.message);
    } else {
      console.log(`  ✓ Password updated`);
    }
  } else {
    // Create auth user
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

  // Check if user profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, email, user_type')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    console.log(`  ⚠️  User profile already exists, updating...`);
    
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
    
    console.log(`  ✓ User profile updated`);
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

    console.log(`  ✓ User profile created`);
  }

  return userId;
}

async function main() {
  console.log('🚀 Creating test users...\n');

  try {
    // Get or create demo school
    const schoolId = await getOrCreateDemoSchool();

    // Create all users
    for (const user of testUsers) {
      await createUser(user, schoolId);
    }

    console.log('\n✅ All test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testUsers.forEach((user) => {
      console.log(`${user.userType.toUpperCase().padEnd(10)} | ${user.email.padEnd(20)} | ${user.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('\n❌ Error creating users:', error);
    process.exit(1);
  }
}

main();
