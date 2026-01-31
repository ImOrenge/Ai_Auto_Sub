import { getSupabaseServer } from "../lib/supabaseServer";

async function list50RecentJobs() {
  const supabase = getSupabaseServer();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, assets(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("\n=== 50 RECENT JOBS ===");
  jobs?.forEach((job, i) => {
    // Only log if created today or is one of the top 5
    const isToday = job.created_at.startsWith("2026-01-21");
    if (isToday || i < 5) {
        console.log(`\n[${i+1}] ID: ${job.id}`);
        console.log("    Created:", job.created_at);
        console.log("    Status:", job.status);
        console.log("    URL:", job.url);
        console.log("    Asset ID:", job.asset_id);
    }
  });
}

list50RecentJobs().catch(console.error);
