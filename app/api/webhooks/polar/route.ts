import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const webhookHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    webhookHeaders[key] = value;
  });

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  let event: any;
  try {
    event = validateEvent(body, webhookHeaders, webhookSecret);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  console.log(`[Polar Webhook] Received event: ${event.type}`);

  const supabase = getSupabaseServer();

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data;
        const { userId, planId } = sub.metadata || {};

        if (!userId || !planId) {
          console.warn("[Polar Webhook] Missing metadata in subscription event", sub.id);
          return NextResponse.json({ ok: true }); // Still return OK to Polar
        }

        // Map status
        let status = "active";
        if (sub.status === "past_due") status = "past_due";
        if (sub.status === "incomplete") status = "incomplete";
        if (sub.status === "revoked" || sub.status === "canceled") status = "canceled";

        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan_id: planId,
            status: status,
            billing_cycle: sub.recurringInterval === "month" ? "monthly" : "yearly",
            current_period_start: sub.currentPeriodStart,
            current_period_end: sub.currentPeriodEnd,
            cancel_at_period_end: sub.cancelAtPeriodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (error) {
          console.error("[Polar Webhook] Error updating subscription:", error);
          throw error;
        }
        break;
      }

      case "subscription.revoked": {
        const sub = event.data;
        const { userId } = sub.metadata || {};

        if (userId) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", userId);

          if (error) {
            console.error("[Polar Webhook] Error revoking subscription:", error);
            throw error;
          }
        }
        break;
      }

      default:
        console.log(`[Polar Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[Polar Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
