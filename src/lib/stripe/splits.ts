/**
 * Revenue split logic for creator subscriptions.
 *
 * Standard:     60% creator / 40% platform
 * Collab:       70% creator / 30% platform
 *               (content tagged as collaboration between two verified creators)
 *
 * Game subs:    100% platform (no Connect transfer applied)
 */

export interface SplitResult {
  creatorPct: number;
  platformPct: number;
  creatorAmountCents: number;
  platformAmountCents: number;
}

export function computeCreatorSplit(
  totalCents: number,
  isCollabContent: boolean
): SplitResult {
  const creatorPct = isCollabContent ? 0.70 : 0.60;
  const platformPct = 1 - creatorPct;

  // Floor creator amount, platform gets the remainder (avoids rounding loss)
  const creatorAmountCents = Math.floor(totalCents * creatorPct);
  const platformAmountCents = totalCents - creatorAmountCents;

  return { creatorPct, platformPct, creatorAmountCents, platformAmountCents };
}

/**
 * Builds the Stripe PaymentIntent / Invoice params for a creator subscription.
 * Uses Stripe Connect: funds flow to platform, then transfer to creator.
 *
 * @param totalCents   Amount charged to subscriber (before Stripe fee)
 * @param creatorStripeAccountId  Connected Stripe account of the creator
 * @param isCollabContent  Whether the content involves a verified collab
 */
export function buildConnectTransferParams(
  totalCents: number,
  creatorStripeAccountId: string,
  isCollabContent: boolean
): {
  application_fee_amount: number;
  transfer_data: { destination: string };
} {
  const { platformAmountCents } = computeCreatorSplit(totalCents, isCollabContent);

  return {
    application_fee_amount: platformAmountCents,
    transfer_data: { destination: creatorStripeAccountId },
  };
}
