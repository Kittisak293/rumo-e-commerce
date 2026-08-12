import type { RenderedMail } from './otp-email';

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderConfirmationData {
  orderNumber: string;
  items: OrderConfirmationItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: {
    fullName: string;
    phone: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
}

// Decimal columns come back from `pg` as strings — coerce before formatting.
const baht = (value: number) => `฿${Number(value).toLocaleString('en-US')}`;

// Product names and address fields are supplied by users and sellers, so they
// must not be able to inject markup into the HTML part of the mail.
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function buildOrderConfirmationEmail(
  order: OrderConfirmationData,
): RenderedMail {
  const shipping =
    Number(order.shippingFee) > 0 ? baht(order.shippingFee) : 'ฟรี';
  const { address } = order;
  const recipientLine = `${address.fullName} | ${address.phone}`;
  const areaLine = `${address.subdistrict}, ${address.district}, ${address.province} ${address.postalCode}`;

  return {
    subject: `ยืนยันคำสั่งซื้อ ${order.orderNumber} — RUMO`,
    text: [
      'ชำระเงินสำเร็จ',
      '',
      `ขอบคุณสำหรับคำสั่งซื้อ หมายเลข ${order.orderNumber}`,
      '',
      'รายการสินค้า',
      ...order.items.map(
        (item) => `- ${item.name} x${item.quantity}  ${baht(item.lineTotal)}`,
      ),
      '',
      `ยอดรวมสินค้า  ${baht(order.subtotal)}`,
      `ค่าจัดส่ง  ${shipping}`,
      `ยอดชำระทั้งหมด  ${baht(order.total)}`,
      '',
      'ที่อยู่จัดส่ง',
      recipientLine,
      areaLine,
      '',
      'เราจะแจ้งให้ทราบอีกครั้งเมื่อพัสดุถูกจัดส่ง',
    ].join('\n'),
    html: `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1d1d1d">
  <div style="text-align:center;margin-bottom:28px">
    <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:28px;font-weight:700">&#10003;</div>
    <h1 style="margin:16px 0 4px;font-size:20px;font-weight:700">ชำระเงินสำเร็จ</h1>
    <p style="margin:0;font-size:14px;color:#6b7280">ขอบคุณสำหรับคำสั่งซื้อของคุณ</p>
  </div>

  <div style="border:1px solid #e5e7eb;border-radius:14px;padding:20px">
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
      <tr>
        <td style="color:#6b7280">หมายเลขคำสั่งซื้อ</td>
        <td style="text-align:right"><strong style="color:#6d28d9">${esc(order.orderNumber)}</strong></td>
      </tr>
    </table>

    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">
      ${order.items
        .map(
          (item) => `
      <tr>
        <td style="padding:10px 0;border-top:1px solid #f3f4f6">
          ${esc(item.name)}
          <span style="color:#9ca3af"> x${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-top:1px solid #f3f4f6;text-align:right;white-space:nowrap">${baht(item.lineTotal)}</td>
      </tr>`,
        )
        .join('')}
    </table>

    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;margin-top:16px;border-top:1px solid #e5e7eb">
      <tr>
        <td style="padding:8px 0;color:#6b7280">ยอดรวมสินค้า</td>
        <td style="padding:8px 0;text-align:right">${baht(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 8px;color:#6b7280">ค่าจัดส่ง</td>
        <td style="padding:0 0 8px;text-align:right;color:#16a34a">${shipping}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;border-top:1px solid #e5e7eb;font-size:16px;font-weight:600">ยอดชำระทั้งหมด</td>
        <td style="padding:12px 0 0;border-top:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#6d28d9">${baht(order.total)}</td>
      </tr>
    </table>
  </div>

  <div style="border:1px solid #e5e7eb;border-radius:14px;padding:20px;margin-top:16px">
    <div style="font-size:15px;font-weight:600;margin-bottom:10px">ที่อยู่จัดส่ง</div>
    <div style="font-size:14px">${esc(recipientLine)}</div>
    <div style="font-size:13px;color:#6b7280;margin-top:4px">${esc(areaLine)}</div>
  </div>

  <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center">
    เราจะแจ้งให้ทราบอีกครั้งเมื่อพัสดุถูกจัดส่ง
  </p>
</div>`.trim(),
  };
}
