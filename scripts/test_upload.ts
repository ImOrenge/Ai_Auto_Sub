import { getSupabaseServer } from "../lib/supabaseServer";
import { env } from "../lib/env";

async function testUpload() {
  const supabase = getSupabaseServer();
  const testContent = "This is a test file content to verify upload permissions.";
  const buffer = Buffer.from(testContent);
  const objectPath = `test/permission-test-${Date.now()}.txt`;

  console.log(`Testing upload to bucket: ${env.resultsBucket}, path: ${objectPath}`);
  
  const { data, error } = await supabase.storage
    .from(env.resultsBucket)
    .upload(objectPath, buffer, {
      contentType: "text/plain",
      upsert: true
    });

  if (error) {
    console.error("Upload FAILED:", error);
    process.exit(1);
  }

  console.log("Upload SUCCEEDED:", data);

  const { data: { publicUrl } } = supabase.storage
    .from(env.resultsBucket)
    .getPublicUrl(objectPath);
    
  console.log("Public URL:", publicUrl);

  // cleanup
  console.log("Cleaning up test file...");
  const { error: deleteError } = await supabase.storage
    .from(env.resultsBucket)
    .remove([objectPath]);
    
  if (deleteError) {
    console.warn("Cleanup FAILED:", deleteError);
  } else {
    console.log("Cleanup SUCCEEDED");
  }
}

testUpload().catch(console.error);
