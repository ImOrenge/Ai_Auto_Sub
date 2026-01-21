import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    return fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .reduce((acc, line) => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                acc[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
            }
            return acc;
        }, {} as Record<string, string>);
}

const env = loadEnv();
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatuses() {
  console.log('Checking distinct job statuses...');
  
  // Fetch all statuses
  const { data, error } = await supabase
    .from('jobs')
    .select('status');

  if (error) {
      console.error('Error fetching jobs:', error.message);
      return;
  }

  // Count distinct statuses
  const counts: Record<string, number> = {};
  data.forEach(job => {
      counts[job.status] = (counts[job.status] || 0) + 1;
  });

  console.log('Current Statuses found in DB:');
  console.table(counts);

  const allowed = [
    'pending', 'downloading', 'processing', 'stt', 'translating', 
    'subtitle', 'uploading', 'preprocessing', 'compositing',
    'awaiting_edit', 'editing', 'ready_to_export', 'exporting',
    'done', 'error', 'canceled'
  ];

  const invalid = Object.keys(counts).filter(s => !allowed.includes(s));
  
  if (invalid.length > 0) {
      console.error('❌ Found INVALID statuses that violate the new constraint:', invalid);
  } else {
      console.log('✅ All statuses seem valid according to the list in script.');
      console.log('Double check if the migration file list matches this script list exactly.');
  }
}

checkStatuses();
