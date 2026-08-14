// String-valued to match the values already live in Order.status ('pending',
// 'paid', ...) — a numeric enum would require a column type change and break
// the frontend's status label map (see composables/useOrderStatus.ts).
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  SHIPPED = 'shipped',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Covers the whole lifecycle, payment *and* fulfilment. The shipment half used
// to be missing here, which meant `ALLOWED_TRANSITIONS[order.status]` was
// `undefined` for any shipped order and transitionStatus silently bailed —
// every entry must stay present, including the terminal empty ones.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PROCESSING,
    OrderStatus.PAID,
    OrderStatus.FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.FAILED],
  [OrderStatus.PAID]: [
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.FAILED]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  // Skipping straight to DELIVERED is allowed: a same-day handover can produce
  // a single 'delivered' scan with nothing in between.
  [OrderStatus.SHIPPED]: [OrderStatus.SHIPPING, OrderStatus.DELIVERED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};
