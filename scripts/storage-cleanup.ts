import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// Manually load .env.local
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
const supabase = createClient(supabaseUrl, supabaseKey);

const RESULTS_BUCKET = 'results';
const EXPIRY_DAYS = 3;

async function deleteFilesRecursive(bucket: string, folder = '') {
  const { data, error } = await supabase.storage.from(bucket).list(folder);

  if (error) {
    console.error(`Error listing ${bucket}/${folder}:`, error.message);
    return;
  }

  if (!data || data.length === 0) return;

  const filesToDelete: string[] = [];
  const now = new Date();

  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;

    if (item.id === null) {
      // It's a folder
      await deleteFilesRecursive(bucket, itemPath);
    } else {
      // It's a file
      let shouldDelete = false;

      // 1. Always delete from cache, subtitles, videos
      if (folder.startsWith('cache') || folder.startsWith('subtitles') || folder.startsWith('videos')) {
        shouldDelete = true;
      }
      
      // 2. Delete old exports
      if (folder.startsWith('exports')) {
        const modifiedDate = new Date(item.created_at);
        const ageInDays = (now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > EXPIRY_DAYS) {
          shouldDelete = true;
        }
      }

      if (shouldDelete) {
        filesToDelete.push(itemPath);
      }
    }
  }

  if (filesToDelete.length > 0) {
    console.log(`Deleting ${filesToDelete.length} files from ${bucket}/${folder}...`);
    const { error: deleteError } = await supabase.storage.from(bucket).remove(filesToDelete);
    if (deleteError) {
      console.error(`Error deleting files in ${bucket}/${folder}:`, deleteError.message);
    } else {
      console.log(`Successfully deleted: ${filesToDelete.join(', ')}`);
    }
  }
}

async function main() {
  console.log('Starting Supabase Storage Cleanup...');
  await deleteFilesRecursive(RESULTS_BUCKET);
  console.log('Cleanup finished.');
}

main().catch(console.error);
