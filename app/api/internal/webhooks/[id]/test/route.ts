import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WebhookService } from "@/lib/webhooks/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the webhook to ensure it belongs to the user
  const { data: webhook, error } = await supabase
    .from("webhooks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  try {
    const timestamp = Date.now().toString();
    const payload = JSON.stringify({
      id: crypto.randomUUID(),
      event: "webhook.test",
      timestamp,
      data: {
        message: "This is a test notification from AI Sub Auto",
        webhook_id: id
      }
    });

    const signature = WebhookService.signPayload(payload, webhook.secret, timestamp);
    
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": "webhook.test",
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Signature": signature,
        "User-Agent": "AI-Sub-Auto-Webhook/1.0",
      },
      body: payload,
    });

    return NextResponse.json({ 
      success: response.ok, 
      status: response.status,
      statusText: response.statusText 
    });
  } catch (error) {
    console.error("Webhook test failed", error);
    return NextResponse.json({ error: "Failed to reach endpoint" }, { status: 500 });
  }
}
