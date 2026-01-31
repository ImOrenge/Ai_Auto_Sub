import { createHmac } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

export type WebhookEvent = 
  | "job.completed" 
  | "job.failed" 
  | "job.started" 
  | "apikey.created" 
  | "apikey.deleted" 
  | "webhook.created" 
  | "webhook.deleted"
  | "webhook.test";

export class WebhookService {
  /**
   * Triggers webhooks for a specific user and event.
   */
  static async trigger(userId: string, event: WebhookEvent, payload: any) {
    const supabase = getSupabaseServer();

    // 1. Fetch active webhooks for this user and event
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .contains("events", [event]);

    if (error || !webhooks || webhooks.length === 0) {
      return;
    }

    // 2. Send notifications in parallel
    const promises = webhooks.map((webhook) => 
      this.sendNotification(webhook, event, payload)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Sends a POST request to a single webhook URL.
   */
  private static async sendNotification(webhook: any, event: WebhookEvent, payload: any) {
    const timestamp = Date.now().toString();
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      event,
      timestamp,
      data: payload,
    });

    const signature = this.signPayload(body, webhook.secret, timestamp);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          "X-Webhook-Timestamp": timestamp,
          "X-Webhook-Signature": signature,
          "User-Agent": "AI-Sub-Auto-Webhook/1.0",
        },
        body,
      });

      if (!response.ok) {
        console.warn(`[Webhook] Delivery failed to ${webhook.url}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[Webhook] Error sending to ${webhook.url}:`, error);
    }
  }

  /**
   * Generates a signature for the payload using HMAC-SHA256.
   */
  public static signPayload(body: string, secret: string, timestamp: string): string {
    const hmac = createHmac("sha256", secret);
    const content = `${timestamp}.${body}`;
    return hmac.update(content).digest("hex");
  }
}
