import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getUsageLedger, aggregateUsage } from "@/lib/billing/repository";
import { pricingPlans } from "@/lib/pricing";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET(request: Request) {
    const cookieStore = await cookies();
    
    // Create an authenticated Supabase client for the user
    const supabaseUser = createServerClient(
        env.supabaseUrl,
        env.supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Determine billing period (Simplification: Current Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get projectId from query params
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId') || undefined;

        // Fetch Data
        const [ledger, usage] = await Promise.all([
            getUsageLedger(user.id, startOfMonth, endOfMonth, 100, projectId),
            aggregateUsage(user.id, startOfMonth, endOfMonth, projectId)
        ]);

        // Get Plan Limits (Simplification: Assume FREE if no sub)
        const plan = pricingPlans.find(p => p.id === 'free') || pricingPlans[0];
        
        // Parse quota string "30분" -> 30
        const quotaString = plan.quota || "0";
        const limitMinutes = parseInt(quotaString.replace(/[^0-9]/g, ""), 10) || 0;

        return NextResponse.json({
            period: { start: startOfMonth, end: endOfMonth },
            usage: {
                sttMinutes: usage.sttMinutes,
                limitMinutes: limitMinutes,
                percentage: limitMinutes > 0 ? Math.min(100, (usage.sttMinutes / limitMinutes) * 100) : 0
            },
            ledger
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown usage error";
        console.error("Usage API Error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
