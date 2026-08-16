import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { AdminOrderData } from 'src/stores/adminShipmentStore';

export type OrderListItem = Omit<AdminOrderData, 'orderItems' | 'shipments'>;
export type AdminOrderDetail = AdminOrderData;

function describeError(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return error.message || fallback;
}

export const useAdminOrderStore = defineStore('adminOrder', {
  state: () => ({
    orders: [] as OrderListItem[],
    loading: false,
    error: null as string | null,
    detail: null as AdminOrderDetail | null,
    detailLoading: false,
    detailError: null as string | null,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get<OrderListItem[]>('/orders');
        // Backend doesn't sort — newest orders first is this page's whole point.
        this.orders = [...res.data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      } catch (err: unknown) {
        this.error = describeError(err, 'โหลดรายการคำสั่งซื้อไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id: number) {
      this.detailLoading = true;
      this.detailError = null;
      this.detail = null;
      try {
        const res = await api.get<AdminOrderDetail>(`/orders/admin/${id}`);
        this.detail = res.data;
      } catch (err: unknown) {
        this.detailError = describeError(err, 'โหลดรายละเอียดคำสั่งซื้อไม่สำเร็จ');
      } finally {
        this.detailLoading = false;
      }
    },

    clearDetail() {
      this.detail = null;
      this.detailError = null;
    },
  },
});
