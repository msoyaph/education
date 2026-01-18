/**
 * Script to list all schools in the database
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function listSchools() {
  console.log('🔍 Listing all schools...\n');

  const { data, error } = await supabase
    .from('schools')
    .select('id, name, code, slug, is_active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing schools:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No schools found.');
    return;
  }

  console.log(`Found ${data.length} school(s):\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ID                                    | NAME            | CODE         | ACTIVE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  data.forEach((school) => {
    console.log(`${school.id} | ${(school.name || '').padEnd(15)} | ${(school.code || '').padEnd(12)} | ${school.is_active}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

listSchools();
