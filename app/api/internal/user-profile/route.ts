import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingService } from "@/lib/billing/service";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entitlements = await BillingService.getEntitlements(user.id);
    const subscription = await BillingService.getSubscription(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      subscription: {
        plan: entitlements.planName,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      limits: entitlements
    });
  } catch (error) {
    console.error("Failed to fetch user profile", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
