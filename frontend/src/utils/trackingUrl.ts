// Client-side preview only — mirrors backend/src/carriers/tracking-url.util.ts
// so the admin carrier form can show what a real link will look like before
// saving. The backend does the actual replace at send-time; this is cosmetic.
export const TRACKING_NUMBER_PLACEHOLDER = '{trackingNumber}';
export const SAMPLE_TRACKING_NUMBER = 'TH0000000000';

export function previewTrackingUrl(template: string, trackingNumber: string): string | null {
  if (!template.includes(TRACKING_NUMBER_PLACEHOLDER)) return null;
  return template.replace(TRACKING_NUMBER_PLACEHOLDER, trackingNumber);
}
