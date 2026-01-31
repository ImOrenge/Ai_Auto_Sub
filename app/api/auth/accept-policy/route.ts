import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  POLICY_METADATA_ACCEPTED_AT_KEY,
  POLICY_METADATA_VERSION_KEY,
  POLICY_VERSION,
} from "@/lib/policy";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      [POLICY_METADATA_VERSION_KEY]: POLICY_VERSION,
      [POLICY_METADATA_ACCEPTED_AT_KEY]: new Date().toISOString(),
    },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
