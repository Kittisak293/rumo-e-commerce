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

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    cartItems: [] as CartItemData[],
    addresses: [] as AddressData[],
    selectedAddressId: null as number | null,
    lastOrder: null as OrderResult | null,
    loading: false,
    checkoutLoading: false,
    error: null as string | null,
  }),

  getters: {
    subtotal: (state) =>
      state.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0),
    shippingFee: () => 0,
    total(): number {
      return this.subtotal + this.shippingFee;
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
