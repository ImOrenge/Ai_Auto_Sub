import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Manually load .env.local for standalone script execution
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = value;
    }
  });
  console.log("Loaded environment from .env.local");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key. Check .env.local");
    process.exit(1);
}

/**
 * Utility script to clear all project data for a fresh start.
 */
async function clearAllData() {
  console.log("Cleaning up all jobs and assets...");
  
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  // 1. Delete all jobs
  const { error: jobsError } = await supabase.from("jobs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (jobsError) {
    console.error("Failed to clear jobs:", jobsError.message);
  } else {
    console.log("Cleared all jobs.");
  }

  // 2. Delete all assets
  const { error: assetsError } = await supabase.from("assets").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (assetsError) {
    console.error("Failed to clear assets:", assetsError.message);
  } else {
    console.log("Cleared all assets.");
  }

  console.log("Database reset complete.");
}

clearAllData().catch(console.error);
