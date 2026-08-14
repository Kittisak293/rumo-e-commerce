<template>
  <q-page class="success-page">
    <!-- Verifying: waiting for the Stripe webhook to actually land before
         we claim success, rather than trusting the client-side confirm -->
    <div v-if="phase === 'verifying' || store.loading" style="display: flex; flex-direction: column; align-items: center; padding: 80px 0;">
      <q-spinner-dots size="48px" color="purple" />
      <div style="margin-top: 16px; font-size: 14px; color: #6b7280;">กำลังตรวจสอบการชำระเงิน...</div>
    </div>

    <!-- Timeout: webhook hasn't landed after MAX_POLL_ATTEMPTS — don't spin forever -->
    <div v-else-if="phase === 'timeout'" class="success-container">
      <div class="success-icon-wrapper">
        <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
          <path d="M12 7v5l3 3" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div style="font-size: 24px; font-weight: 700; color: #1d1d1d; margin-bottom: 6px;">การยืนยันใช้เวลานานกว่าปกติ</div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 28px;">ถ้าตัดเงินสำเร็จแล้ว ระบบจะอัปเดตสถานะให้ในไม่ช้า</div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="action-btn primary" @click="retryVerify">ตรวจสอบอีกครั้ง</button>
        <button
          class="action-btn secondary"
          @click="$router.push({ name: 'orderDetail', params: { orderId: String(route.params.orderId) } })"
        >ดูคำสั่งซื้อ</button>
      </div>
    </div>

    <!-- Success Content -->
    <div v-else-if="phase === 'success' && store.lastOrder" class="success-container">
      <!-- Success Icon -->
      <div class="success-icon-wrapper">
        <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#16a34a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <div style="font-size: 24px; font-weight: 700; color: #1d1d1d; margin-bottom: 6px;">ชำระเงินสำเร็จ!</div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 28px;">ขอบคุณสำหรับคำสั่งซื้อของคุณ</div>

      <!-- Order Details Card -->
      <div class="success-card">
        <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 16px;">รายละเอียดคำสั่งซื้อ</div>

        <div class="detail-row">
          <span class="detail-label">หมายเลขคำสั่งซื้อ</span>
          <span class="detail-value" style="color: #6d28d9; font-weight: 600;">{{ store.lastOrder.orderNumber }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">วันที่สั่งซื้อ</span>
          <span class="detail-value">{{ formatDate(store.lastOrder.createdAt) }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">สถานะ</span>
          <span class="status-badge">{{ getStatusLabel(store.lastOrder.status) }}</span>
        </div>

        <div style="border-top: 1px solid #f3f4f6; margin: 14px 0;" />

        <!-- Order Items -->
        <div v-for="item in store.lastOrder.orderItems" :key="item.id"
            style="display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f9fafb;">
          <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name"
              style="width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: #f3f4f6;" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13.5px; font-weight: 500; color: #1d1d1d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ item.product.name }}
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">x{{ item.quantity }}</div>
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #6d28d9; white-space: nowrap;">
            ฿{{ Number(item.lineTotal).toLocaleString() }}
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; margin: 14px 0;" />

        <div class="detail-row">
          <span class="detail-label">ยอดรวมสินค้า</span>
          <span class="detail-value">฿{{ Number(store.lastOrder.subtotal).toLocaleString() }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ค่าจัดส่ง</span>
          <span class="detail-value" style="color: #16a34a;">ฟรี</span>
        </div>
        <div style="border-top: 1px solid #e5e7eb; margin: 10px 0;" />
        <div class="detail-row">
          <span style="font-size: 16px; font-weight: 600; color: #1d1d1d;">ยอดชำระทั้งหมด</span>
          <span style="font-size: 18px; font-weight: 700; color: #6d28d9;">฿{{ Number(store.lastOrder.total).toLocaleString() }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button
          class="action-btn primary"
          @click="$router.push({ name: 'orderDetail', params: { orderId: store.lastOrder!.id } })"
        >ดูรายละเอียดคำสั่งซื้อ</button>
        <button class="action-btn secondary" @click="$router.push({ name: 'home' })">กลับหน้าหลัก</button>
      </div>
    </div>

    <!-- Fail Content -->
    <div v-else-if="phase === 'failed' && store.lastOrder" class="success-container">
      <div class="success-icon-wrapper">
        <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#fee2e2" />
          <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" stroke-width="2.6" stroke-linecap="round" />
        </svg>
      </div>

      <div style="font-size: 24px; font-weight: 700; color: #1d1d1d; margin-bottom: 6px;">ชำระเงินไม่สำเร็จ</div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">ยังไม่มีการตัดเงินจากบัญชีของคุณ</div>

      <div class="payment-error-banner">
        <div class="payment-error-banner__icon">!</div>
        <div class="payment-error-banner__text">กรุณาลองชำระเงินอีกครั้ง หรือเลือกวิธีชำระเงินอื่น</div>
      </div>

      <div class="success-card">
        <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 16px;">รายละเอียดคำสั่งซื้อ</div>

        <div class="detail-row">
          <span class="detail-label">หมายเลขคำสั่งซื้อ</span>
          <span class="detail-value" style="color: #6d28d9; font-weight: 600;">{{ store.lastOrder.orderNumber }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">วันที่สั่งซื้อ</span>
          <span class="detail-value">{{ formatDate(store.lastOrder.createdAt) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">สถานะ</span>
          <span class="status-badge">{{ getStatusLabel(store.lastOrder.status) }}</span>
        </div>

        <div style="border-top: 1px solid #e5e7eb; margin: 14px 0;" />
        <div class="detail-row">
          <span style="font-size: 16px; font-weight: 600; color: #1d1d1d;">ยอดที่ต้องชำระ</span>
          <span style="font-size: 18px; font-weight: 700; color: #1d1d1d;">฿{{ Number(store.lastOrder.total).toLocaleString() }}</span>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button
          class="action-btn primary"
          @click="$router.push({ name: 'checkoutConfirm', query: { retryOrderId: String(store.lastOrder!.id) } })"
        >ลองใหม่</button>
        <button class="action-btn secondary" @click="$router.push({ name: 'checkout' })">กลับหน้าตะกร้า</button>
      </div>
    </div>

    <!-- Error -->
    <div v-else style="text-align: center; padding: 80px 20px;">
      <div style="font-size: 16px; color: #ef4444;">ไม่พบข้อมูลคำสั่งซื้อ</div>
      <button class="action-btn primary" style="margin-top: 16px; max-width: 200px; margin-left: auto; margin-right: auto;" @click="$router.push({ name: 'home' })">กลับหน้าหลัก</button>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useCheckoutStore } from 'src/stores/checkoutStore';
import { useCartStore } from 'src/stores/cartStore';
import { getStatusLabel } from 'src/composables/useOrderStatus';
import { getImageUrl } from 'src/utils/imageUrl';

const store = useCheckoutStore();
const cart = useCartStore();
const route = useRoute();

// Stripe appends `redirect_status` to `return_url` after an off-site
// PromptPay/redirect confirmation — `failed` is the only outcome that
// needs the fail branch; anything else (incl. absent, for card payments
// that never redirect) reads as success.
const isFailed = computed(() => route.query.redirect_status === 'failed');

// Stripe confirms the payment client-side (that's why this page loads at
// all), but order.status only flips to paid once the async webhook lands —
// so a single fetch right after redirect can still read it as 'pending'.
// Withhold the success screen and poll instead of showing a "success" badge
// next to a stale "pending" status.
const phase = ref<'verifying' | 'success' | 'failed' | 'timeout' | 'error'>('verifying');
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 10;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

async function pollUntilSettled(orderId: number, attempt = 0) {
  await store.fetchOrder(orderId);
  const status = store.lastOrder?.status;
  if (!store.lastOrder) {
    phase.value = 'error';
    return;
  }
  if (status === 'failed') {
    phase.value = 'failed';
    return;
  }
  if (status === 'pending' || status === 'processing') {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      phase.value = 'timeout';
      return;
    }
    pollTimer = setTimeout(() => void pollUntilSettled(orderId, attempt + 1), POLL_INTERVAL_MS);
    return;
  }
  phase.value = 'success';
}

function retryVerify() {
  const orderId = Number(route.params.orderId);
  if (!orderId) return;
  phase.value = 'verifying';
  void pollUntilSettled(orderId);
}

onMounted(() => {
  const orderId = Number(route.params.orderId);
  if (!orderId) {
    phase.value = 'error';
    return;
  }
  if (isFailed.value) {
    phase.value = 'failed';
    void store.fetchOrder(orderId);
  } else {
    void pollUntilSettled(orderId);
  }
  // The confirm page already re-queried the cart count, but the Stripe
  // webhook that actually deletes the paid rows can still be in flight at
  // that point — reconcile again once landed here.
  void cart.fetchCount();
});

onBeforeUnmount(() => {
  if (pollTimer) clearTimeout(pollTimer);
});

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

</script>

<style scoped>
.success-page {
  padding: 28px 40px 60px;
  max-width: 720px;
  margin: 0 auto;
}

.success-container {
  text-align: center;
}

.success-icon-wrapper {
  margin-bottom: 16px;
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.success-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.detail-label {
  font-size: 14px;
  color: #6b7280;
}

.detail-value {
  font-size: 14px;
  color: #1d1d1d;
  font-weight: 500;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 4px 12px;
  border-radius: 999px;
}

.action-btn {
  flex: 1;
  padding: 13px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.action-btn.primary {
  background: linear-gradient(135deg, #8e4dff, #6d28d9);
  color: #fff;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(109, 40, 217, 0.4);
}

.action-btn.secondary {
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.action-btn.secondary:hover {
  background: #f9fafb;
}

.action-btn:active {
  transform: scale(0.98);
}

.payment-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
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

.payment-error-banner__text {
  font-size: 13px;
  color: #b91c1c;
}

@media (max-width: 860px) {
  .success-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
}
</style>
