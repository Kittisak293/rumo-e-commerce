import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

interface CartItemQuantity {
  quantity: number;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    count: 0,
  }),

  actions: {
    async fetchCount() {
      try {
        const res = await api.get<CartItemQuantity[]>('/cart-item/my-cart');
        this.count = res.data.reduce((sum, item) => sum + item.quantity, 0);
      } catch {
        this.count = 0;
      }
    },

    reset() {
      this.count = 0;
    },
  },
});
