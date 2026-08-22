import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFetch() {
  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .limit(5);
      
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Records:', data);
  }
}

testFetch();
