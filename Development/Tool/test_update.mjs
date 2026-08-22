import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpdate() {
  console.log('Fetching most recent session...');
  const { data: sessions, error: fetchError } = await supabase
    .from('diagnostic_sessions')
    .select('id, status, completed_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError || !sessions || sessions.length === 0) {
    console.error('Fetch error or no sessions:', fetchError);
    return;
  }

  const session = sessions[0];
  console.log('Found session:', session.id, 'status:', session.status, 'completed_at:', session.completed_at);

  console.log('Attempting to update status to completed...');
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .update({ status: 'completed' })
    .eq('id', session.id)
    .select();

  if (error) {
    console.error('Update failed with error:', error.message);
  } else if (data.length === 0) {
    console.error('Update succeeded but returned 0 rows! RLS issue?');
  } else {
    console.log('Update successful:', data);
  }
}

testUpdate();
