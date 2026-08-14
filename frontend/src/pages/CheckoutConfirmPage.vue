<template>
  <q-page class="checkout-page">
    <div v-if="store.loading" style="display: flex; justify-content: center; padding: 80px 0;">
      <q-spinner-dots size="48px" color="purple" />
    </div>

    <div v-else class="confirm-grid">
      <!-- Left column: items + address + summary -->
      <div class="confirm-left">
        <div style="font-size: 24px; font-weight: 600; margin-bottom: 20px; color: #1d1d1d;">ยืนยันการชำระเงิน</div>

        <!-- Items -->
        <div class="checkout-card" style="margin-bottom: 16px;">
          <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">รายการสินค้า</div>
          <div v-for="item in displayItems" :key="item.id" class="item-row">
            <img :src="getImageUrl(item.imageUrl)" :alt="item.name" class="item-row__img" />
            <div style="flex: 1; min-width: 0;">
              <div class="item-row__name">{{ item.name }}</div>
              <div class="item-row__meta">฿{{ Number(item.price).toLocaleString() }} × {{ item.quantity }}</div>
            </div>
            <div class="item-row__total">฿{{ Number(item.lineTotal).toLocaleString() }}</div>
          </div>
        </div>

        <!-- Address Section -->
        <div class="checkout-card" style="margin-bottom: 16px;">
          <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">ที่อยู่จัดส่ง</div>

          <div v-if="store.addresses.length === 0" style="color: #6b7280; font-size: 13px; margin-bottom: 12px;">
            ยังไม่มีที่อยู่จัดส่ง กรุณาเพิ่มที่อยู่
          </div>

          <div
            v-for="addr in store.addresses"
            :key="addr.id"
            class="address-option"
            :class="{ 'address-option--active': store.selectedAddressId === addr.id }"
            @click="store.selectAddress(addr.id)"
          >
            <div style="font-size: 14px; font-weight: 500; color: #1d1d1d;">{{ addr.fullName }} | {{ addr.phone }}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
              {{ addr.subdistrict }}, {{ addr.district }}, {{ addr.province }} {{ addr.postalCode }}
            </div>
          </div>

          <button type="button" class="add-address-btn" @click="showAddForm = !showAddForm">
            {{ showAddForm ? '− ยกเลิก' : '+ เพิ่มที่อยู่ใหม่' }}
          </button>

          <form v-if="showAddForm" class="address-form" @submit.prevent="handleAddAddress">
            <q-input
              v-model="form.postalCode"
              dense outlined
              mask="#####"
              label="รหัสไปรษณีย์"
              hint="กรอกรหัสไปรษณีย์เพื่อเติมจังหวัด/อำเภอ/ตำบลอัตโนมัติ"
              class="q-mb-sm"
              @update:model-value="handlePostalCodeInput"
            />
            <div v-if="postalCodeChecked && zipMatches.length === 0" class="zip-hint">
              ไม่พบข้อมูลที่อยู่จากรหัสไปรษณีย์นี้ กรุณากรอกด้วยตนเอง
            </div>
            <q-input v-model="form.fullName" dense outlined label="ชื่อ-นามสกุล" class="q-mb-sm" />
            <q-input v-model="form.phone" dense outlined label="เบอร์โทร" class="q-mb-sm" />
            <q-input v-model="form.province" dense outlined label="จังหวัด" class="q-mb-sm" />
            <q-input v-model="form.district" dense outlined label="อำเภอ/เขต" class="q-mb-sm" />
            <q-select
              v-if="subdistrictOptions.length > 0"
              v-model="form.subdistrict"
              dense outlined
              emit-value
              map-options
              label="ตำบล/แขวง"
              class="q-mb-sm"
              :options="subdistrictOptions"
              @update:model-value="handleSubdistrictSelect"
            />
            <q-input v-else v-model="form.subdistrict" dense outlined label="ตำบล/แขวง" class="q-mb-sm" />
            <button type="submit" class="checkout-btn" :disabled="addingAddress">
              {{ addingAddress ? 'กำลังบันทึก...' : 'บันทึกที่อยู่' }}
            </button>
          </form>
        </div>

        <!-- Summary -->
        <div class="checkout-card">
          <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">สรุปยอดชำระ</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; color: #6b7280;">ยอดรวมสินค้า ({{ displayTotalQuantity }} ชิ้น)</span>
            <span style="font-size: 14px; color: #1d1d1d;">฿{{ displaySubtotal.toLocaleString() }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; color: #6b7280;">ค่าจัดส่ง</span>
            <span style="font-size: 14px; color: #16a34a;">ฟรี</span>
          </div>
          <div v-if="!isRetry && store.appliedDiscountCode" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; color: #16a34a;">ส่วนลด ({{ store.appliedDiscountCode }})</span>
            <span style="font-size: 14px; color: #16a34a;">−฿{{ store.discountAmount.toLocaleString() }}</span>
          </div>

          <div style="border-top: 1px solid #e5e7eb; margin: 12px 0;" />
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 16px; font-weight: 600; color: #1d1d1d;">ยอดรวม</span>
            <span class="grand-total">฿{{ displayTotal.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Right column: payment box -->
      <div class="confirm-right">
        <div class="payment-box">
          <div v-if="store.paymentError" class="payment-error-banner">
            <div class="payment-error-banner__icon">!</div>
            <div style="flex: 1; min-width: 0;">
              <div class="payment-error-banner__title">ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</div>
              <div class="payment-error-banner__sub">
                รหัส: {{ store.paymentError.code }} · ยังไม่มีการตัดเงินจากบัญชีของคุณ
              </div>
            </div>
            <button type="button" class="payment-error-banner__close" @click="store.clearPaymentError()">✕</button>
          </div>

          <div class="payment-box__label">วิธีชำระเงิน</div>

          <div class="payment-placeholder-wrap">
            <div v-if="!paymentReady" class="payment-placeholder">กำลังโหลดฟอร์มชำระเงิน...</div>
            <div v-show="paymentReady" id="payment-element" />
          </div>

          <button
            type="button"
            class="pay-btn"
            :class="{ 'pay-btn--loading': store.checkoutLoading, 'pay-btn--disabled': isPayDisabled }"
            :disabled="isPayDisabled || store.checkoutLoading"
            @click="handleConfirm"
          >
            <span v-if="store.checkoutLoading" class="pay-btn__spinner" />
            {{ store.checkoutLoading ? 'กำลังดำเนินการ...' : `ยืนยันการชำระเงิน · ฿${displayTotal.toLocaleString()}` }}
          </button>

          <div class="payment-box__note">ชำระเงินปลอดภัยผ่าน Stripe</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import { useCheckoutStore } from 'src/stores/checkoutStore';
import { useCartStore } from 'src/stores/cartStore';
import { useAuthStore } from 'src/stores/authStore';
import { useAddressAutofill, type AddressMatch } from 'src/composables/useAddressAutofill';
import { getImageUrl } from 'src/utils/imageUrl';

const store = useCheckoutStore();
const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { lookupByZipcode } = useAddressAutofill();

// A "ลองใหม่" retry from the result page arrives with the existing order's
// id — the cart was already emptied by the first placeOrder() call, so
// there's nothing left to re-checkout. Reuse that order (and its Stripe
// PaymentIntent, which the backend already returns idempotently) instead of
// creating a second order for the same items.
const retryOrderId = computed(() => {
  const raw = Number(route.query.retryOrderId);
  return Number.isInteger(raw) && raw > 0 ? raw : null;
});
const isRetry = computed(() => retryOrderId.value !== null);

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);
let stripe: Stripe | null = null;
let elements: StripeElements | null = null;
const paymentReady = ref(false);
const orderId = ref<number | null>(null);
const settingUpPayment = ref(false);

const showAddForm = ref(false);
const addingAddress = ref(false);
const form = reactive({
  fullName: '',
  phone: '',
  province: '',
  district: '',
  subdistrict: '',
  postalCode: '',
});

const zipMatches = ref<AddressMatch[]>([]);
const postalCodeChecked = ref(false);

const isPayDisabled = computed(() => !store.selectedAddressId || !paymentReady.value);

interface DisplayItem {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

// Retry mode reads from the fetched order (the cart is already empty by
// then); the normal flow reads from the live cart.
const displayItems = computed<DisplayItem[]>(() => {
  if (isRetry.value && store.lastOrder) {
    return store.lastOrder.orderItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));
  }
  return store.cartItems.map((item) => ({
    id: item.id,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    price: item.price,
    quantity: item.quantity,
    lineTotal: item.subtotal,
  }));
});

const displaySubtotal = computed(() =>
  isRetry.value && store.lastOrder ? Number(store.lastOrder.subtotal) : store.subtotal,
);
const displayTotal = computed(() =>
  isRetry.value && store.lastOrder ? Number(store.lastOrder.total) : store.total,
);
const displayTotalQuantity = computed(() =>
  isRetry.value && store.lastOrder ? Number(store.lastOrder.totalQuantity) : store.totalQuantity,
);

const subdistrictOptions = computed(() => {
  const seen = new Set<string>();
  const options: { label: string; value: string }[] = [];
  for (const match of zipMatches.value) {
    if (!seen.has(match.subdistrict)) {
      seen.add(match.subdistrict);
      options.push({ label: match.subdistrict, value: match.subdistrict });
    }
  }
  return options;
});

const applyZipMatches = (matches: AddressMatch[]) => {
  zipMatches.value = matches;
  if (matches.length === 0) return;

  const first = matches[0] as AddressMatch;
  if (matches.every((m) => m.province === first.province)) {
    form.province = first.province;
  }
  if (matches.every((m) => m.district === first.district)) {
    form.district = first.district;
  }

  if (matches.length === 1) {
    form.subdistrict = first.subdistrict;
  } else if (!matches.some((m) => m.subdistrict === form.subdistrict)) {
    form.subdistrict = '';
  }
};

const handlePostalCodeInput = async (value: string | number | null) => {
  const zip = String(value ?? '');
  postalCodeChecked.value = zip.length === 5;
  applyZipMatches(zip.length === 5 ? await lookupByZipcode(zip) : []);
};

const handleSubdistrictSelect = (value: string) => {
  const match = zipMatches.value.find((m) => m.subdistrict === value);
  if (match) {
    form.district = match.district;
    form.province = match.province;
  }
};

onMounted(() => {
  // paymentError is Pinia state, not page-local — clear a stale error left
  // over from a previous failed attempt so it doesn't show before this
  // visit has even tried to pay.
  store.clearPaymentError();
  // Addresses still need to load even on retry (to satisfy the
  // selectedAddressId watch below); the cart itself is irrelevant since the
  // items being shown come from the existing order instead.
  if (store.addresses.length === 0) void store.fetchCheckoutData();
  if (isRetry.value && retryOrderId.value) {
    orderId.value = retryOrderId.value;
    void store.fetchOrder(retryOrderId.value);
  }
});

// As soon as a shipping address is picked: place the order and open a
// PaymentIntent, then mount Stripe's Payment Element. `automatic_payment_methods`
// is enabled on the backend intent, so Stripe itself decides which methods to
// offer (card, PromptPay, ...) inside that one element — no method picker here.
const setupPayment = async () => {
  if (settingUpPayment.value || paymentReady.value) return;
  if (!store.selectedAddressId) return;
  settingUpPayment.value = true;
  try {
    if (!orderId.value) {
      const order = await store.placeOrder(store.selectedAddressId);
      if (!order) return;
      orderId.value = order.id;
    }
    const secret = await store.createPaymentIntent(orderId.value);
    if (!secret) return;

    stripe = await stripePromise;
    if (!stripe) return;
    elements = stripe.elements({ clientSecret: secret });
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
    paymentReady.value = true;
  } finally {
    settingUpPayment.value = false;
  }
};

watch(
  () => store.selectedAddressId,
  (id) => {
    if (id) void setupPayment();
  },
  { immediate: true },
);

const handleAddAddress = async () => {
  if (!auth.user) return;
  addingAddress.value = true;
  try {
    const created = await store.addAddress({ ...form, userId: auth.user.id, isDefault: false });
    if (created) {
      showAddForm.value = false;
      Object.assign(form, {
        fullName: '',
        phone: '',
        province: '',
        district: '',
        subdistrict: '',
        postalCode: '',
      });
      zipMatches.value = [];
      postalCodeChecked.value = false;
    }
  } finally {
    addingAddress.value = false;
  }
};

const handleConfirm = async () => {
  if (isPayDisabled.value || !stripe || !elements || !orderId.value) return;

  store.checkoutLoading = true;
  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success/${orderId.value}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      store.paymentError = { message: error.message ?? 'Payment failed', code: error.code ?? 'card_error' };
      return;
    }
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      store.cartItems = [];
      // Re-query rather than guess locally, so leftover items (added after
      // this order was placed, or not part of it) show their real count.
      
      void cart.fetchCount();
      await router.push({ name: 'paymentSuccess', params: { orderId: String(orderId.value) } });
    }
  } finally {
    store.checkoutLoading = false;
  }
};
</script>

<style scoped>
.checkout-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.confirm-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 24px;
  align-items: start;
}

.confirm-right {
  position: sticky;
  top: 24px;
}

.checkout-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.item-row:last-child {
  border-bottom: none;
}

.item-row__img {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  background: #f3f4f6;
  flex-shrink: 0;
}

.item-row__name {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-row__meta {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 4px;
}

.item-row__total {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  white-space: nowrap;
  text-align: right;
}

.grand-total {
  font-size: 34px;
  font-weight: 700;
  color: #6d28d9;
  letter-spacing: -0.5px;
}

.address-option {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.address-option--active {
  border-color: #6d28d9;
  background: #f5f3ff;
}

.add-address-btn {
  background: none;
  border: 1px dashed #a855f7;
  color: #6d28d9;
  border-radius: 12px;
  padding: 10px;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.address-form {
  margin-top: 14px;
}

.zip-hint {
  font-size: 12px;
  color: #b45309;
  margin: -4px 0 10px;
}

/* Payment box */
.payment-box {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.payment-box__label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.payment-placeholder-wrap {
  margin-bottom: 16px;
}

.payment-placeholder {
  border: 1.5px dashed #d8b4fe;
  background: #faf7ff;
  border-radius: 16px;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 20px;
  font-size: 13px;
  color: #9ca3af;
  box-sizing: border-box;
}

#payment-element {
  border: 1.5px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
}

.pay-btn {
  width: 100%;
  padding: 15px;
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
  gap: 8px;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  transition: all 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.pay-btn--loading {
  opacity: 0.5;
  cursor: not-allowed;
}

.pay-btn--disabled {
  background: #e5e7eb;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
}

.pay-btn__spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  animation: pay-btn-spin 0.8s linear infinite;
}

@keyframes pay-btn-spin {
  to {
    transform: rotate(360deg);
  }
}

.payment-box__note {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 12px;
}

.payment-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.payment-error-banner__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.payment-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.payment-error-banner__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #b91c1c;
  cursor: pointer;
  font-size: 13px;
  padding: 2px;
  line-height: 1;
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

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 860px) {
  .checkout-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .confirm-grid {
    grid-template-columns: 1fr;
  }

  .confirm-right {
    position: static;
  }

  .item-row__img {
    width: 52px;
    height: 52px;
  }

  .grand-total {
    font-size: 30px;
  }

  .payment-placeholder {
    height: 150px;
  }
}
</style>
