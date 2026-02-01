import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
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
