import type { RenderedMail } from './otp-email';

export interface ShipmentNotificationData {
  orderNumber: string;
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  estimatedDeliveryAt?: string | null;
}

// Product names and address fields are supplied by users and sellers, so they
// must not be able to inject markup into the HTML part of the mail.
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatEta = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function buildShipmentNotificationEmail(
  shipment: ShipmentNotificationData,
): RenderedMail {
  const eta = formatEta(shipment.estimatedDeliveryAt);
  const trackingLine = shipment.trackingUrl
    ? `ติดตามพัสดุ: ${shipment.trackingUrl}`
    : null;

  return {
    subject: `พัสดุถูกจัดส่งแล้ว — คำสั่งซื้อ ${shipment.orderNumber} — RUMO`,
    text: [
      'พัสดุของคุณถูกจัดส่งเรียบร้อยแล้ว',
      '',
      `คำสั่งซื้อ ${shipment.orderNumber} ถูกส่งมอบให้ ${shipment.carrierName} เรียบร้อยแล้ว`,
      '',
      `ขนส่ง  ${shipment.carrierName}`,
      `หมายเลขพัสดุ  ${shipment.trackingNumber}`,
      ...(eta ? [`คาดว่าจะได้รับ  ${eta}`] : []),
      ...(trackingLine ? ['', trackingLine] : []),
    ].join('\n'),
    html: `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1d1d1d">
  <div style="text-align:center;margin-bottom:28px">
    <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:#ede9fe;color:#6d28d9;font-size:26px">&#128666;</div>
    <h1 style="margin:16px 0 4px;font-size:20px;font-weight:700">พัสดุถูกจัดส่งแล้ว</h1>
    <p style="margin:0;font-size:14px;color:#6b7280">คำสั่งซื้อ ${esc(shipment.orderNumber)} กำลังเดินทางไปหาคุณ</p>
  </div>

  <div style="border:1px solid #e5e7eb;border-radius:14px;padding:20px">
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:6px 0;color:#6b7280">ขนส่ง</td>
        <td style="padding:6px 0;text-align:right;font-weight:600">${esc(shipment.carrierName)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280">หมายเลขพัสดุ</td>
        <td style="padding:6px 0;text-align:right;font-weight:600;color:#6d28d9">${esc(shipment.trackingNumber)}</td>
      </tr>
      ${
        eta
          ? `<tr>
        <td style="padding:6px 0;color:#6b7280">คาดว่าจะได้รับ</td>
        <td style="padding:6px 0;text-align:right">${esc(eta)}</td>
      </tr>`
          : ''
      }
    </table>
  </div>

  ${
    shipment.trackingUrl
      ? `<div style="text-align:center;margin-top:20px">
    <a href="${esc(shipment.trackingUrl)}" style="display:inline-block;padding:12px 28px;border-radius:14px;background:linear-gradient(135deg,#8e4dff,#6d28d9);color:#fff;text-decoration:none;font-weight:600;font-size:14px">ติดตามพัสดุ</a>
  </div>`
      : ''
  }
</div>`.trim(),
  };
}
