import { getSupabaseServer } from "../lib/supabaseServer";
import { withSignedJobAssets } from "../lib/storage/signing";
import { selectJobById } from "../lib/jobs/repository";

async function testSigning(jobId: string) {
  const job = await selectJobById(jobId);
  if (!job) {
    console.error("Job not found:", jobId);
    return;
  }

  console.log("Job Asset ID:", job.assetId);
  console.log("Job Asset Storage Key:", job.asset?.storageKey);
  console.log("Job Result Video URL:", job.resultVideoUrl);

  const enriched = await withSignedJobAssets(job);
  console.log("Enriched Asset Signed URL:", enriched.asset?.signedUrl);
  console.log("Enriched Result Video URL:", enriched.resultVideoUrl);
}

const targetJobId = "188a65c7-2a23-495e-b42c-f010dec582c8";
testSigning(targetJobId).catch(console.error);
