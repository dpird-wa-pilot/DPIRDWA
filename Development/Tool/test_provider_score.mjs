import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxxwckvzdtgxfwyurmyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4eHdja3Z6ZHRneGZ3eXVybXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjUzNTIsImV4cCI6MjEwMjM0MTM1Mn0.J8yuxiGeLxdgHNciLxo3uZI5u0n5Hx9KjjjEavzGifk'
);

async function test() {
  const { data, error } = await supabase
    .from('match_results')
    .select('id, result_type, result_id, result_name, match_score')
    .eq('result_type', 'provider')
    .limit(5);
    
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
