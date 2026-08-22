import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkScores() {
  const { data: sessions } = await supabase.from('diagnostic_sessions').select('operations_score, digital_score, market_score, total_score').limit(1);
  console.log('Session scores:', sessions[0]);

  const { data: matches } = await supabase.from('match_results').select('match_score').limit(1);
  console.log('Match score:', matches[0]);
}

checkScores();
