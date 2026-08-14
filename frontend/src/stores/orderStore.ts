import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { AddressData } from 'src/stores/checkoutStore';

export interface CarrierData {
  id: number;
  name: string;
  code: string;
  website: string | null;
  trackingUrlTemplate: string | null;
  isActive: boolean;
}

export interface ShipmentEventData {
  id: number;
  status: string;
  description: string;
  location: string | null;
  occurredAt: string;
}

export interface ShipmentData {
  id: number;
  trackingNumber: string | null;
  status: string;
  lastLocation: string | null;
  estimatedDeliveryAt: string | null;
  createdAt: string;
  carrier: CarrierData;
  trackingUrl?: string | null;
  shipmentEvents?: ShipmentEventData[];
}

export interface OrderItemData {
  id: number;
  price: number;
  quantity: number;
  lineTotal: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  totalQuantity: number;
  status: string;
  createdAt: string;
  // Order has no dedicated cancelledAt/refundedAt column — this is the
  // closest real timestamp for "when did the order land in this state",
  // used only by the off-track explanatory card on the detail page.
  updatedAt: string;
  orderItems: OrderItemData[];
  address: AddressData;
  shipments: ShipmentData[];
}

export type OrderDetail = OrderSummary;

export interface TrackingResult {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  orderItems: OrderItemData[];
  address: AddressData;
  shipments: ShipmentData[];
}

/**
 * Tabs on the order-list page (mockup 1a) — value '' means no filter ("ทั้งหมด").
 * These are UX groupings over the 9 raw `Order.status` values, not a 1:1 map:
 *   pending    -> pending | processing | failed   (needs the customer to act)
 *   preparing  -> paid                            ("เตรียมจัดส่ง": paid, not dispatched yet)
 *   shipping   -> shipped | shipping               ("กำลังจัดส่ง": dispatched or in transit)
 *   delivered  -> delivered
 *   cancelled  -> cancelled | refunded             (closed, no further action)
 */
export type OrderStatusFilter = '' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

function matchesFilter(status: string, filter: OrderStatusFilter): boolean {
  switch (filter) {
    case 'pending':
      return ['pending', 'processing', 'failed'].includes(status);
    case 'preparing':
      return status === 'paid';
    case 'shipping':
      return ['shipped', 'shipping'].includes(status);
    case 'delivered':
      return status === 'delivered';
    case 'cancelled':
      return ['cancelled', 'refunded'].includes(status);
    default:
      return true;
  }
}

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [] as OrderSummary[],
    orderDetail: null as OrderDetail | null,
    tracking: null as TrackingResult | null,
    loading: false,
    detailLoading: false,
    trackingLoading: false,
    error: null as string | null,
    detailError: null as string | null,
    trackingError: null as string | null,
    statusFilter: '' as OrderStatusFilter,
  }),

  getters: {
    filteredOrders(state): OrderSummary[] {
      if (!state.statusFilter) return state.orders;
      return state.orders.filter((o) => matchesFilter(o.status, state.statusFilter));
    },
    statusCounts(state): Record<OrderStatusFilter, number> {
      const counts: Record<OrderStatusFilter, number> = {
        '': state.orders.length,
        pending: 0,
        preparing: 0,
        shipping: 0,
        delivered: 0,
        cancelled: 0,
      };
      for (const order of state.orders) {
        if (matchesFilter(order.status, 'pending')) counts.pending++;
        else if (matchesFilter(order.status, 'preparing')) counts.preparing++;
        else if (matchesFilter(order.status, 'shipping')) counts.shipping++;
        else if (matchesFilter(order.status, 'delivered')) counts.delivered++;
        else if (matchesFilter(order.status, 'cancelled')) counts.cancelled++;
      }
      return counts;
    },
  },

  actions: {
    async fetchMyOrders() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get<OrderSummary[]>('/orders/my-orders');
        this.orders = res.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to load orders';
      } finally {
        this.loading = false;
      }
    },

    async fetchOrder(orderId: number) {
      this.detailLoading = true;
      this.detailError = null;
      this.orderDetail = null;
      try {
        const res = await api.get<OrderDetail>(`/orders/${orderId}`);
        this.orderDetail = res.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.detailError = error.response?.data?.message || error.message || 'Failed to load order';
      } finally {
        this.detailLoading = false;
      }
    },

    async fetchTracking(orderId: number) {
      this.trackingLoading = true;
      this.trackingError = null;
      this.tracking = null;
      try {
        const res = await api.get<TrackingResult>(`/orders/${orderId}/tracking`);
        this.tracking = res.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.trackingError = error.response?.data?.message || error.message || 'Failed to load tracking';
      } finally {
        this.trackingLoading = false;
      }
    },

    setStatusFilter(filter: OrderStatusFilter) {
      this.statusFilter = filter;
    },
  },
});
