import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// Manually load .env.local since dotenv is not a dependency
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        process.env[parts[0].trim()] = parts[1].trim();
      }
    });
  } catch (e) {
    console.warn('Could not load .env.local');
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles(bucket: string, folder = '') {
  console.log(`\n--- Listing bucket: ${bucket} (folder: ${folder || 'root'}) ---`);
  const { data, error } = await supabase.storage.from(bucket).list(folder);

  if (error) {
    if (error.message.includes('Bucket not found')) {
        console.log(`Bucket ${bucket} not found.`);
        return;
    }
    console.error(`Error listing ${bucket}:`, error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No files found.');
    return;
  }

  for (const item of data) {
    if (item.id === null) {
      // It's a folder
      await listFiles(bucket, folder ? `${folder}/${item.name}` : item.name);
    } else {
      console.log(`${folder ? folder + '/' : ''}${item.name} (${(item.metadata.size / 1024 / 1024).toFixed(2)} MB) - Modified: ${item.created_at}`);
    }
  }
}

async function main() {
  await listFiles('results');
  await listFiles('uploads');
}

main().catch(console.error);
