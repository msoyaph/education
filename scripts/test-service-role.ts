/**
 * Test script to verify service_role key works
 * 
 * Usage: npx tsx scripts/test-service-role.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

console.log('🔍 Testing Supabase Connection with Service Role Key...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}... (${supabaseServiceKey.length} chars)\n`);

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Basic Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Test 1: Try to query a table (schools table should exist after migrations)
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('Invalid API key') || error.code === 'PGRST301') {
        console.error('❌ Invalid API key error!');
        console.error('\n💡 Troubleshooting:');
        console.error('  1. Go to: https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn/settings/api');
        console.error('  2. Make sure you\'re copying the "service_role" key (NOT "anon")');
        console.error('  3. The key should be very long (200+ characters)');
        console.error('  4. Make sure there are no spaces or line breaks in the key');
        console.error('  5. If you regenerated keys, make sure you copied the new one');
        console.error('\n🔧 To fix:');
        console.error('  1. Open your .env file');
        console.error('  2. Delete the SUPABASE_SERVICE_ROLE_KEY line');
        console.error('  3. Copy the service_role key from Supabase dashboard');
        console.error('  4. Paste it on a new line: SUPABASE_SERVICE_ROLE_KEY=your-key-here');
        return false;
      }
      
      if (error.message.includes('permission denied') || error.code === '42501') {
        console.error('❌ Permission denied - but connection works!');
        console.error('   This means the key format is correct, but there might be a permissions issue.');
        return true;
      }
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('✓ Connection successful!');
        console.log('⚠️  Note: Tables don\'t exist yet - you need to run migrations first.');
        return true;
      }
      
      console.error(`❌ Error: ${error.message}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log(`   Found ${data?.length || 0} schools`);
    return true;
  } catch (err: any) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function testAuth() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Auth Admin API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Test admin API access (service role key is required)
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (error) {
      if (error.message.includes('Invalid API key')) {
        console.error('❌ Invalid API key - service_role key is not working');
        return false;
      }
      console.error(`⚠️  Auth API error: ${error.message}`);
      return false;
    }
    
    console.log('✅ Auth Admin API access successful!');
    console.log(`   Service role key is valid and has admin privileges`);
    return true;
  } catch (err: any) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  const connectionWorks = await testConnection();
  const authWorks = await testAuth();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (connectionWorks && authWorks) {
    console.log('\n✅ All tests passed! Your service_role key is valid.');
    console.log('   You can now run: npm run create-users');
  } else if (connectionWorks && !authWorks) {
    console.log('\n⚠️  Connection works but Auth API has issues.');
    console.log('   Check your service_role key in the .env file.');
  } else {
    console.log('\n❌ Connection test failed.');
    console.log('   Check the troubleshooting steps above.');
  }
}

main().catch(console.error);
