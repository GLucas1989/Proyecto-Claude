import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Allows build to proceed without Stripe configured
  // Runtime calls will throw a clear error
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

export const PLATFORM_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
