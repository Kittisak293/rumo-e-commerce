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

        <div v-for="item in store.cartItems" :key="item.id" class="cart-row">
          <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name"
              style="width: 72px; height: 72px; border-radius: 12px; object-fit: cover; background: #f3f4f6;" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; color: #1d1d1d; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ item.product.name }}
            </div>

            <div class="cart-qty-stepper">
              <button
                type="button"
                class="cart-qty-btn"
                title="ลดจำนวน"
                :disabled="item.quantity <= 1 || updatingItemId === item.id"
                @click="adjustQuantity(item, -1)"
              >−</button>
              <span class="cart-qty-value">{{ item.quantity }}</span>
              <button
                type="button"
                class="cart-qty-btn"
                title="เพิ่มจำนวน"
                :disabled="updatingItemId === item.id"
                @click="adjustQuantity(item, 1)"
              >+</button>
            </div>
          </div>
          <div class="cart-row__price-col">
            <div style="font-size: 14px; font-weight: 600; color: #6d28d9; white-space: nowrap;">
              ฿{{ Number(item.subtotal).toLocaleString() }}
            </div>
            <button type="button" class="cart-remove-btn" title="ลบสินค้า" @click="removeItem(item.id)">✕</button>
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

        <div class="discount-row">
          <input
            v-model="discountInput"
            type="text"
            placeholder="ใส่โค้ดส่วนลด"
            class="discount-input"
            :disabled="!!store.appliedDiscountCode"
            @keyup.enter="handleApplyDiscount"
          />
          <button
            type="button"
            class="discount-btn"
            @click="store.appliedDiscountCode ? handleRemoveDiscount() : handleApplyDiscount()"
          >
            {{ store.appliedDiscountCode ? 'ยกเลิก' : 'ใช้โค้ด' }}
          </button>
        </div>
        <div v-if="store.discountError" class="discount-error">{{ store.discountError }}</div>
        <div v-if="store.appliedDiscountCode" style="display: flex; justify-content: space-between; margin: 8px 0;">
          <span style="font-size: 14px; color: #16a34a;">ส่วนลด ({{ store.appliedDiscountCode }})</span>
          <span style="font-size: 14px; color: #16a34a;">−฿{{ store.discountAmount.toLocaleString() }}</span>
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { useCheckoutStore, type CartItemData } from 'src/stores/checkoutStore';
import { getImageUrl } from 'src/utils/imageUrl';

const store = useCheckoutStore();
const router = useRouter();

onMounted(() => {
  void store.fetchCheckoutData();
});

// Address is picked on the confirm step, not here — no gate before proceeding.
const handleCheckout = async () => {
  await router.push({ name: 'checkoutConfirm' });
};

const updatingItemId = ref<number | null>(null);

const adjustQuantity = async (item: CartItemData, delta: number) => {
  const nextQty = item.quantity + delta;
  if (nextQty < 1) return;
  updatingItemId.value = item.id;
  const ok = await store.updateItemQuantity(item.id, nextQty);
  if (!ok) {
    Notify.create({ type: 'negative', message: store.error || 'แก้ไขจำนวนไม่สำเร็จ' });
  }
  updatingItemId.value = null;
};

const removeItem = async (itemId: number) => {
  const ok = await store.removeItem(itemId);
  if (!ok) {
    Notify.create({ type: 'negative', message: store.error || 'ลบสินค้าไม่สำเร็จ' });
  }
};

const discountInput = ref('');

const handleApplyDiscount = () => {
  const ok = store.applyDiscountCode(discountInput.value);
  if (ok) discountInput.value = '';
};

const handleRemoveDiscount = () => {
  store.clearDiscountCode();
  discountInput.value = '';
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

.cart-row {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.cart-row__price-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.cart-qty-stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-qty-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #6d28d9;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.cart-qty-btn:hover:not(:disabled) {
  border-color: #6d28d9;
  background: #f5f3ff;
}

.cart-qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cart-qty-value {
  font-size: 13px;
  color: #1d1d1d;
  min-width: 16px;
  text-align: center;
}

.cart-remove-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.cart-remove-btn:hover {
  background: #fecaca;
}

.discount-row {
  display: flex;
  gap: 8px;
  margin: 4px 0;
}

.discount-input {
  flex: 1;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-family: inherit;
  min-width: 0;
}

.discount-input:disabled {
  background: #f3f4f6;
  color: #6b7280;
}

.discount-btn {
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6d28d9;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}

.discount-btn:hover {
  background: #ede9fe;
}

.discount-error {
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 4px;
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
