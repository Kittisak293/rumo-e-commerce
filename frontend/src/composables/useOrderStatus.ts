// Single source of truth for the `Order.status` vocabulary — badge colors,
// Thai labels and stepper position. Values are transcribed from the design
// doc's status-reference table (docs/design/RUMO Shipping Tracking Standalone.html,
// turn 4a) — do not invent new colors here.

export interface OrderStatusMeta {
  label: string;
  color: string;
  bg: string;
  border?: string;
}

export const ORDER_STATUS_META: Record<string, OrderStatusMeta> = {
  pending: { label: 'รอชำระเงิน', color: '#c2410c', bg: '#fff7ed' },
  processing: { label: 'กำลังดำเนินการ', color: '#6b7280', bg: '#f3f4f6' },
  paid: { label: 'ชำระเงินแล้ว', color: '#8e4dff', bg: '#f5f3ff' },
  failed: { label: 'ชำระเงินไม่สำเร็จ', color: '#dc2626', bg: '#fef2f2' },
  shipped: { label: 'จัดส่งแล้ว', color: '#6d28d9', bg: '#ede9fe' },
  shipping: { label: 'กำลังจัดส่ง', color: '#6d28d9', bg: '#ddd6fe' },
  delivered: { label: 'ส่งถึงแล้ว', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'ยกเลิก', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
  refunded: { label: 'คืนเงินแล้ว', color: '#b45309', bg: '#fffbeb' },
};

const FALLBACK_META: OrderStatusMeta = { label: 'ไม่ทราบสถานะ', color: '#6b7280', bg: '#f3f4f6' };

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  return ORDER_STATUS_META[status] ?? FALLBACK_META;
}

export function getStatusLabel(status: string): string {
  return getOrderStatusMeta(status).label;
}

/** Statuses where the 4-step progress stepper doesn't apply — a card explains why instead (mockup 2e). */
const TERMINAL_OFF_TRACK_STATUSES = new Set(['cancelled', 'refunded', 'failed', 'pending', 'processing']);

/**
 * Position (0-3) of `status` on the paid → shipped → shipping → delivered
 * stepper, or `null` when the order never got that far / left the track.
 */
export function orderStepIndex(status: string): 0 | 1 | 2 | 3 | null {
  if (TERMINAL_OFF_TRACK_STATUSES.has(status)) return null;
  switch (status) {
    case 'paid':
      return 0;
    case 'shipped':
      return 1;
    case 'shipping':
      return 2;
    case 'delivered':
      return 3;
    default:
      return null;
  }
}

// ShipmentStatus (7 values) badge colors — transcribed from the design doc's
// badge-reference table (docs/design/DESIGN-shipping-admin.html, turn 5a).
// Deliberately separate from ORDER_STATUS_META: same badge shape, distinct
// palette so the two never look interchangeable when shown side by side.
export const SHIPMENT_STATUS_META: Record<string, OrderStatusMeta> = {
  pending: { label: 'รอขนส่งเข้ารับ', color: '#6b7280', bg: '#f3f4f6' },
  picked_up: { label: 'ขนส่งรับพัสดุแล้ว', color: '#8e4dff', bg: '#f5f3ff' },
  in_transit: { label: 'อยู่ระหว่างขนส่ง', color: '#6d28d9', bg: '#ede9fe' },
  out_for_delivery: { label: 'กำลังนำจ่าย', color: '#6d28d9', bg: '#ddd6fe' },
  delivered: { label: 'ส่งถึงแล้ว', color: '#16a34a', bg: '#dcfce7' },
  failed: { label: 'นำจ่ายไม่สำเร็จ', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  returned: { label: 'ตีกลับผู้ขาย', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
};

export function getShipmentStatusMeta(status: string): OrderStatusMeta {
  return SHIPMENT_STATUS_META[status] ?? FALLBACK_META;
}

// Mirrors backend `ORDER_STATUS_FOR_EVENT` (shipment_events.service.ts) —
// used only to warn the admin in the event form before they save, never to
// drive the actual transition (the backend is the source of truth for that).
export const ORDER_STATUS_FOR_SHIPMENT_EVENT: Partial<Record<string, string>> = {
  picked_up: 'shipping',
  in_transit: 'shipping',
  out_for_delivery: 'shipping',
  delivered: 'delivered',
};

export function formatThaiDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatThaiDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
