import { Carrier } from './entities/carrier.entity';

/** Placeholder a carrier's `trackingUrlTemplate` must use. */
export const TRACKING_NUMBER_PLACEHOLDER = '{trackingNumber}';

/**
 * Deep link to the carrier's own tracking page, or `null` when we can't build
 * one (carrier has no template, or the parcel has no tracking number yet).
 *
 * Shared by the dispatch email and the customer tracking endpoint so the link
 * a user gets by mail is the same one the page shows.
 */
export function buildTrackingUrl(
  carrier: Pick<Carrier, 'trackingUrlTemplate'> | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!carrier?.trackingUrlTemplate || !trackingNumber) return null;
  return carrier.trackingUrlTemplate.replace(
    TRACKING_NUMBER_PLACEHOLDER,
    encodeURIComponent(trackingNumber),
  );
}
