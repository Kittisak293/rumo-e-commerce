// String-valued to match the values already live in Order.status ('pending',
// 'paid', ...) — a numeric enum would require a column type change and break
// the frontend's status label map (see PaymentSuccessPage.vue).
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
}

// Scoped to the payment webhook state machine only. Order.status also takes
// shipment-lifecycle values ('shipped', 'delivered', 'cancelled', 'refunded',
// ...) written elsewhere (orders.controller update) — those are untouched by
// transitionStatus and not represented here.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PROCESSING,
    OrderStatus.PAID,
    OrderStatus.FAILED,
  ],
  [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.FAILED],
  [OrderStatus.PAID]: [],
  [OrderStatus.FAILED]: [OrderStatus.PENDING],
};
