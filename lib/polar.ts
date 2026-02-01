import { Polar } from "@polar-sh/sdk";

const accessToken = process.env.POLAR_ACCESS_TOKEN;

if (!accessToken) {
  console.warn("⚠️ POLAR_ACCESS_TOKEN is missing in environment variables.");
}

export const polar = new Polar({
  accessToken: accessToken || "",
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || (process.env.NODE_ENV === "production" ? "production" : "sandbox"),
});

export const POLAR_ORG_ID = process.env.POLAR_ORGANIZATION_ID;

export async function createPolarCheckout(productId: string, planId: string, userId: string, userEmail: string) {
  const checkout = await polar.checkouts.create({
    products: [productId],
    customerEmail: userEmail,
    metadata: {
      userId: userId,
      planId: planId,
    },
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
  });

  return checkout;
}
