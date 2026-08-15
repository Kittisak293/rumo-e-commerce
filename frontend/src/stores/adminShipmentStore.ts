import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { AddressData } from 'src/stores/checkoutStore';
import type { CarrierData, OrderItemData, ShipmentData } from 'src/stores/orderStore';

export interface AdminOrderData {
  id: number;
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  totalQuantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string };
  address: AddressData;
  orderItems: OrderItemData[];
  shipments: ShipmentData[];
}

export interface CreateShipmentPayload {
  orderId: number;
  carrierId: number;
  trackingNumber: string;
  lastLocation?: string;
  estimatedDeliveryAt?: string;
}

export interface AddShipmentEventPayload {
  shipmentId: number;
  status: string;
  description: string;
  location?: string;
  occurredAt?: string;
}

export interface CreateCarrierPayload {
  name: string;
  code: string;
  website?: string;
  trackingUrlTemplate?: string;
  isActive?: boolean;
}

function describeError(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return error.message || fallback;
}

export const useAdminShipmentStore = defineStore('adminShipment', {
  state: () => ({
    orders: [] as AdminOrderData[],
    carriers: [] as CarrierData[],
    loading: false,
    error: null as string | null,
    actionLoading: false,
    actionError: null as string | null,
  }),

  actions: {
    async fetchQueue() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get<AdminOrderData[]>('/orders/admin/shipping-queue');
        this.orders = res.data;
      } catch (err: unknown) {
        this.error = describeError(err, 'โหลดคิวงานจัดส่งไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },

    async fetchCarriers() {
      try {
        const res = await api.get<CarrierData[]>('/carriers/admin');
        this.carriers = res.data;
      } catch (err: unknown) {
        this.error = describeError(err, 'โหลดรายชื่อขนส่งไม่สำเร็จ');
      }
    },

    async createShipment(payload: CreateShipmentPayload): Promise<boolean> {
      this.actionLoading = true;
      this.actionError = null;
      try {
        await api.post('/shipments', payload);
        await this.fetchQueue();
        return true;
      } catch (err: unknown) {
        this.actionError = describeError(err, 'สร้างพัสดุไม่สำเร็จ');
        return false;
      } finally {
        this.actionLoading = false;
      }
    },

    async addShipmentEvent(payload: AddShipmentEventPayload): Promise<boolean> {
      this.actionLoading = true;
      this.actionError = null;
      try {
        await api.post('/shipment-events', payload);
        await this.fetchQueue();
        return true;
      } catch (err: unknown) {
        this.actionError = describeError(err, 'บันทึกเหตุการณ์ไม่สำเร็จ');
        return false;
      } finally {
        this.actionLoading = false;
      }
    },

    async createCarrier(payload: CreateCarrierPayload): Promise<boolean> {
      this.actionLoading = true;
      this.actionError = null;
      try {
        await api.post('/carriers', payload);
        await this.fetchCarriers();
        return true;
      } catch (err: unknown) {
        this.actionError = describeError(err, 'เพิ่มขนส่งไม่สำเร็จ');
        return false;
      } finally {
        this.actionLoading = false;
      }
    },

    async updateCarrier(id: number, payload: Partial<CreateCarrierPayload>): Promise<boolean> {
      this.actionLoading = true;
      this.actionError = null;
      try {
        await api.patch(`/carriers/${id}`, payload);
        await this.fetchCarriers();
        return true;
      } catch (err: unknown) {
        this.actionError = describeError(err, 'แก้ไขขนส่งไม่สำเร็จ');
        return false;
      } finally {
        this.actionLoading = false;
      }
    },

    async removeCarrier(id: number): Promise<boolean> {
      try {
        await api.delete(`/carriers/${id}`);
        this.carriers = this.carriers.filter((c) => c.id !== id);
        return true;
      } catch (err: unknown) {
        this.error = describeError(err, 'ลบขนส่งไม่สำเร็จ');
        return false;
      }
    },

    clearActionError() {
      this.actionError = null;
    },
  },
});
