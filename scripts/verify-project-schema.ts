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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log('Testing SELECT * on "projects" table...');
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (error) {
     console.error('❌ Select FAILED:', error.message);
     console.log('Full Error:', error);
  } else {
    console.log('✅ Select SUCCEEDED. Data:', data);
  }
}

verifySchema();
