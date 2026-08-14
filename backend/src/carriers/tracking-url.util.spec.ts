import { buildTrackingUrl } from './tracking-url.util';

describe('buildTrackingUrl', () => {
  const carrier = {
    trackingUrlTemplate:
      'https://th.kerryexpress.com/track/?track={trackingNumber}',
  };

  it('substitutes the tracking number into the template', () => {
    expect(buildTrackingUrl(carrier, 'TH123')).toBe(
      'https://th.kerryexpress.com/track/?track=TH123',
    );
  });

  it('URL-encodes the tracking number', () => {
    expect(buildTrackingUrl(carrier, 'TH 123/A')).toBe(
      'https://th.kerryexpress.com/track/?track=TH%20123%2FA',
    );
  });

  it('returns null when the carrier has no template', () => {
    expect(buildTrackingUrl({ trackingUrlTemplate: null }, 'TH123')).toBeNull();
  });

  it('returns null when the carrier is missing', () => {
    expect(buildTrackingUrl(null, 'TH123')).toBeNull();
  });

  it('returns null when there is no tracking number yet', () => {
    expect(buildTrackingUrl(carrier, null)).toBeNull();
    expect(buildTrackingUrl(carrier, undefined)).toBeNull();
  });
});
