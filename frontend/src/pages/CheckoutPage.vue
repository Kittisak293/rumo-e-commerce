<template>
  <q-page class="checkout-page">
    <!-- Loading -->
    <div v-if="store.loading" style="display: flex; justify-content: center; padding: 80px 0;">
      <q-spinner-dots size="48px" color="purple" />
    </div>

    <!-- Empty Cart -->
    <div v-else-if="store.cartItems.length === 0" style="text-align: center; padding: 80px 20px;">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style="margin-bottom: 16px; opacity: 0.3;">
        <path d="M6 8h12l-1 12H7L6 8Z" stroke="#6d28d9" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M9 8V6a3 3 0 1 1 6 0v2" stroke="#6d28d9" stroke-width="1.5" />
      </svg>
      <div style="font-size: 18px; color: #6b7280; margin-bottom: 12px;">ตะกร้าสินค้าว่างเปล่า</div>
      <button class="checkout-btn" style="max-width: 200px; margin: 0 auto;" @click="$router.push({ name: 'home' })">กลับหน้าหลัก</button>
    </div>

    <!-- Checkout Content -->
    <div v-else>
      <div style="font-size: 24px; font-weight: 600; margin-bottom: 20px; color: #1d1d1d;">สรุปคำสั่งซื้อ</div>

      <!-- Cart Items -->
      <div class="checkout-card" style="margin-bottom: 16px;">
        <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">รายการสินค้า</div>

        <div v-for="item in store.cartItems" :key="item.id"
            style="display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name"
              style="width: 72px; height: 72px; border-radius: 12px; object-fit: cover; background: #f3f4f6;" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; color: #1d1d1d; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ item.product.name }}
            </div>
            <div style="font-size: 13px; color: #6b7280;">x{{ item.quantity }}</div>
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #6d28d9; white-space: nowrap;">
            ฿{{ Number(item.subtotal).toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="checkout-card" style="margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">สรุปยอดชำระ</div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">ยอดรวมสินค้า ({{ store.totalQuantity }} ชิ้น)</span>
          <span style="font-size: 14px; color: #1d1d1d;">฿{{ store.subtotal.toLocaleString() }}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">ค่าจัดส่ง</span>
          <span style="font-size: 14px; color: #16a34a;">ฟรี</span>
        </div>
        <div style="border-top: 1px solid #e5e7eb; margin: 12px 0;" />
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 16px; font-weight: 600; color: #1d1d1d;">ยอดชำระทั้งหมด</span>
          <span style="font-size: 18px; font-weight: 700; color: #6d28d9;">฿{{ store.total.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Checkout Button -->
      <button class="checkout-btn" @click="handleCheckout">
        ดำเนินการชำระเงิน
      </button>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCheckoutStore } from 'src/stores/checkoutStore';

const store = useCheckoutStore();
const router = useRouter();

onMounted(() => {
  void store.fetchCheckoutData();
});

const getImageUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API as string || 'http://localhost:3000';
  return `${base}${url}`;
};

// Address is picked on the confirm step, not here — no gate before proceeding.
const handleCheckout = async () => {
  await router.push({ name: 'checkoutConfirm' });
};
</script>

<style scoped>
.checkout-page {
  padding: 28px 40px 60px;
  max-width: 720px;
  margin: 0 auto;
}

.checkout-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.checkout-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #8e4dff, #6d28d9);
  border: none;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  transition: all 0.2s;
  font-family: inherit;
}

.checkout-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(109, 40, 217, 0.4);
}

.checkout-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 860px) {
  .checkout-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
}
</style>
