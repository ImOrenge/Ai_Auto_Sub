import { NextResponse } from "next/server";
import { BillingService } from "@/lib/billing/service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;

        const [subscription, entitlements, invoices] = await Promise.all([
            BillingService.getSubscription(userId),
            BillingService.getEntitlements(userId),
            BillingService.getInvoices(userId),
        ]);

        return NextResponse.json({
            subscription,
            entitlements,
            invoices
        });
    } catch (error) {
        console.error("Failed to fetch billing data:", error);
        return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
    }
}
