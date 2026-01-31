import { getSupabaseServer } from "../lib/supabaseServer";
import { env } from "../lib/env";

async function listStorage() {
  const supabase = getSupabaseServer();
  
  console.log("Listing results bucket...");
  const { data: resultsData, error: resultsError } = await supabase.storage
    .from(env.resultsBucket)
    .list("videos");

  if (resultsError) {
    console.error("Error listing results bucket:", resultsError);
  } else {
    console.log("Files in results/videos:");
    resultsData?.forEach(file => {
      console.log(` - ${file.name} (${file.metadata?.size} bytes, created ${file.created_at})`);
    });
  }

  console.log("\nListing uploads bucket...");
  const { data: uploadsData, error: uploadsError } = await supabase.storage
    .from(env.uploadsBucket)
    .list();

  if (uploadsError) {
    console.error("Error listing uploads bucket:", uploadsError);
  } else {
    console.log("Files in uploads:");
    uploadsData?.forEach(file => {
      console.log(` - ${file.name} (${file.metadata?.size} bytes, created ${file.created_at})`);
    });
  }
}

listStorage().catch(console.error);
