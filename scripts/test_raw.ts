import { getSupabaseServer } from "../lib/supabaseServer";

async function testRaw(jobId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, assets(*)")
    .eq("id", jobId)
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Raw Job Object Keys:", Object.keys(data));
  console.log("Raw assets type:", typeof data.assets);
  console.log("Is array?", Array.isArray(data.assets));
  console.log("assets value:", JSON.stringify(data.assets, null, 2));
}

const targetJobId = "188a65c7-2a23-495e-b42c-f010dec582c8";
testRaw(targetJobId).catch(console.error);
