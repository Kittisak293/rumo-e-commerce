import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export interface CartItemData {
  id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

export interface AddressData {
  id: number;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  isDefault: boolean;
}

export interface OrderResult {
  id: number;
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  totalQuantity: number;
  status: string;
  createdAt: string;
  orderItems: {
    id: number;
    price: number;
    quantity: number;
    lineTotal: number;
    product: {
      id: number;
      name: string;
      imageUrl: string;
    };
  }[];
  address: AddressData;
}

// Local mock coupon table — no backend coupon module exists yet.
const DISCOUNT_CODES: Record<string, { type: 'percent' | 'fixed'; value: number }> = {
  RUMO10: { type: 'percent', value: 10 },
  RUMO50: { type: 'fixed', value: 50 },
  WELCOME20: { type: 'percent', value: 20 },
};

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    cartItems: [] as CartItemData[],
    addresses: [] as AddressData[],
    selectedAddressId: null as number | null,
    lastOrder: null as OrderResult | null,
    loading: false,
    checkoutLoading: false,
    error: null as string | null,
    appliedDiscountCode: null as string | null,
    discountError: null as string | null,
  }),

  getters: {
    subtotal: (state) =>
      state.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0),
    shippingFee: () => 0,
    discountAmount(): number {
      if (!this.appliedDiscountCode) return 0;
      const rule = DISCOUNT_CODES[this.appliedDiscountCode];
      if (!rule) return 0;
      const raw = rule.type === 'percent' ? (this.subtotal * rule.value) / 100 : rule.value;
      return Math.min(raw, this.subtotal);
    },
    total(): number {
      return this.subtotal + this.shippingFee - this.discountAmount;
    },
    totalQuantity: (state) =>
      state.cartItems.reduce((sum, item) => sum + item.quantity, 0),
    defaultAddress: (state) =>
      state.addresses.find((a) => a.isDefault) ?? state.addresses[0] ?? null,
  },

  actions: {
    async fetchCheckoutData() {
      this.loading = true;
      this.error = null;
      try {
        const [cartRes, addrRes] = await Promise.all([
          api.get<CartItemData[]>('/cart-item/my-cart'),
          api.get<AddressData[]>('/addresses/my-addresses'),
        ]);
        this.cartItems = cartRes.data;
        this.addresses = addrRes.data;

        const defaultAddr = this.addresses.find((a) => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId = defaultAddr.id;
        } else if (this.addresses.length > 0 && this.addresses[0]) {
          this.selectedAddressId = this.addresses[0].id;
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to load checkout data';
      } finally {
        this.loading = false;
      }
    },

    async placeOrder(addressId: number): Promise<OrderResult | null> {
      this.checkoutLoading = true;
      this.error = null;
      try {
        const res = await api.post<OrderResult>('/orders/checkout', { addressId });
        this.lastOrder = res.data;
        this.cartItems = [];
        return res.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Checkout failed';
        return null;
      } finally {
        this.checkoutLoading = false;
      }
    },

    selectAddress(addressId: number) {
      this.selectedAddressId = addressId;
    },

    async updateItemQuantity(itemId: number, quantity: number): Promise<boolean> {
      try {
        const res = await api.patch<CartItemData>(`/cart-item/${itemId}`, { quantity });
        const idx = this.cartItems.findIndex((i) => i.id === itemId);
        if (idx !== -1) this.cartItems[idx] = res.data;
        return true;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to update quantity';
        return false;
      }
    },

    async removeItem(itemId: number): Promise<boolean> {
      try {
        await api.delete(`/cart-item/${itemId}`);
        this.cartItems = this.cartItems.filter((i) => i.id !== itemId);
        return true;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to remove item';
        return false;
      }
    },

    applyDiscountCode(code: string): boolean {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        this.discountError = 'กรุณากรอกโค้ดส่วนลด';
        return false;
      }
      if (!DISCOUNT_CODES[normalized]) {
        this.discountError = 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ';
        this.appliedDiscountCode = null;
        return false;
      }
      this.appliedDiscountCode = normalized;
      this.discountError = null;
      return true;
    },

    clearDiscountCode() {
      this.appliedDiscountCode = null;
      this.discountError = null;
    },

    async addAddress(payload: Omit<AddressData, 'id'> & { userId: number }): Promise<AddressData | null> {
      try {
        const res = await api.post<AddressData>('/addresses', payload);
        this.addresses.push(res.data);
        this.selectedAddressId = res.data.id;
        return res.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to add address';
        return null;
      }
    },

    async fetchOrder(orderId: number) {
      this.loading = true;
      try {
        const res = await api.get<OrderResult>(`/orders/${orderId}`);
        this.lastOrder = res.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to load order';
      } finally {
        this.loading = false;
      }
    },
  },
});
