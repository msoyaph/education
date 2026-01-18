/**
 * Script to validate environment variables
 * 
 * Usage: npx tsx scripts/validate-env.ts
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Validating Environment Variables...\n');

// Check if variables exist
console.log('📋 Variable Status:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL: MISSING');
} else {
  const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
  console.log(`✓ SUPABASE_URL: ${supabaseUrl.substring(0, 50)}... ${isValidUrl ? '✓ Valid format' : '⚠️  Check format'}`);
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY: MISSING');
} else {
  const keyLength = supabaseAnonKey.length;
  const startsWithEy = supabaseAnonKey.startsWith('eyJ');
  console.log(`✓ VITE_SUPABASE_ANON_KEY: ${keyLength} chars ${startsWithEy ? '✓ Valid format' : '⚠️  Should start with "eyJ"'}`);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY: MISSING');
} else {
  const keyLength = supabaseServiceKey.length;
  const startsWithEy = supabaseServiceKey.startsWith('eyJ');
  const hasSpaces = supabaseServiceKey.includes(' ');
  const hasNewlines = supabaseServiceKey.includes('\n');
  
  console.log(`✓ SUPABASE_SERVICE_ROLE_KEY: ${keyLength} chars ${startsWithEy ? '✓ Valid format' : '⚠️  Should start with "eyJ"'}`);
  
  if (hasSpaces || hasNewlines) {
    console.error('  ⚠️  WARNING: Key contains spaces or newlines - this will cause "Invalid API key" error!');
    console.error('  💡 Fix: Remove any spaces or line breaks from the key');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Validate key formats
if (supabaseServiceKey && (!supabaseServiceKey.startsWith('eyJ') || supabaseServiceKey.includes(' ') || supabaseServiceKey.includes('\n'))) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY has formatting issues!');
  console.error('\n🔧 Common Issues:');
  console.error('  1. Key has extra spaces or line breaks');
  console.error('  2. Key is truncated (should be very long, ~200+ characters)');
  console.error('  3. Wrong key copied (should be "service_role", not "anon")');
  console.error('\n💡 How to fix:');
  console.error('  1. Go to: https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn/settings/api');
  console.error('  2. Find "service_role" in the table');
  console.error('  3. Click "Reveal" to show it');
  console.error('  4. Copy the ENTIRE key (no spaces, all on one line)');
  console.error('  5. Update .env file with the correct key');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

console.log('✅ All environment variables are present and properly formatted!');
console.log('\n📝 Next steps:');
console.log('  npm run test-connection    # Test connection');
console.log('  npm run create-users       # Create test users');
