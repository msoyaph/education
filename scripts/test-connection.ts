/**
 * Test Supabase Connection
 * 
 * Quick script to verify Supabase credentials are working
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...\n');
  console.log(`URL: ${supabaseUrl}\n`);

  try {
    // Test 1: Check if we can connect
    const { data: health, error: healthError } = await supabase
      .from('schools')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      console.error('\nPossible issues:');
      console.error('  - Database migrations not run');
      console.error('  - RLS policies blocking access');
      console.error('  - Invalid credentials');
      return;
    }

    console.log('✅ Connection successful!');

    // Test 2: Check if schools table exists and is accessible
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, code')
      .limit(5);

    if (schoolsError) {
      console.error('⚠️  Schools table error:', schoolsError.message);
      console.error('\nThis might be normal if:');
      console.error('  - Migrations haven\'t been run yet');
      console.error('  - RLS policies require authentication');
    } else {
      console.log(`✅ Schools table accessible (${schools?.length || 0} schools found)`);
    }

    console.log('\n✅ Supabase connection test complete!');
    console.log('\nNext steps:');
    console.log('  1. Run database migrations in Supabase dashboard');
    console.log('  2. Create test users: npm run create-users');
    console.log('  3. Start dev server: npm run dev');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
