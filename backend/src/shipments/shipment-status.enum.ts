// The parcel-side vocabulary, kept deliberately separate from OrderStatus:
// one order can hold several shipments, so a box being `delivered` does not
// by itself mean the order is. The mapping between the two lives in
// `shipmentStatusToOrderStatus` below and is the only place that bridges them.
export enum ShipmentStatus {
  /** Created in our system, carrier has not collected it yet. */
  PENDING = 'pending',
  /** Carrier has taken possession of the parcel. */
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  /** Delivery attempt failed (nobody home, refused, ...). */
  FAILED = 'failed',
  RETURNED = 'returned',
}
