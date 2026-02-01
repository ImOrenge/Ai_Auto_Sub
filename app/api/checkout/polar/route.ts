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
    const { planId } = await request.json();
    const plan = pricingPlans.find(p => p.id === planId);

    if (!plan || !plan.polarProductId) {
      return NextResponse.json({ error: "Invalid plan or plan not available for checkout" }, { status: 400 });
    }

    const checkout = await createPolarCheckout(plan.polarProductId, plan.id, user.id, user.email || "");

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error("[Polar Checkout Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
