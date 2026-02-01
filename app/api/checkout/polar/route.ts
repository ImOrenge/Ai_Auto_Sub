import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pricingPlans } from "@/lib/pricing";
import { createPolarCheckout } from "@/lib/polar";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planId } = body;
    console.log(`[Polar Checkout] Request for plan: ${planId} for user: ${user.id}`);

    const plan = pricingPlans.find(p => p.id === planId);

    if (!plan || !plan.polarProductId) {
      console.error(`[Polar Checkout] Invalid plan or missing product ID: ${planId}`);
      return NextResponse.json({ error: "Invalid plan or plan not available for checkout" }, { status: 400 });
    }

    const checkout = await createPolarCheckout(plan.polarProductId, plan.id, user.id, user.email || "");
    console.log(`[Polar Checkout] Success: ${checkout.url}`);

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error("[Polar Checkout Error] Detailed Error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.status || error.statusCode,
    });
    
    // If it's a 401 from Polar, we want to know
    const status = error.status || error.statusCode || 500;
    return NextResponse.json({ 
      error: error.message || "Failed to create checkout session",
      detail: error.response?.data || error.message 
    }, { status });
  }
}
