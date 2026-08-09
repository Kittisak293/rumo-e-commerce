<template>
  <q-page class="success-page">
    <!-- Loading -->
    <div v-if="store.loading" style="display: flex; justify-content: center; padding: 80px 0;">
      <q-spinner-dots size="48px" color="purple" />
    </div>

    <!-- Success Content -->
    <div v-else-if="store.lastOrder" class="success-container">
      <!-- Success Icon -->
      <div class="success-icon-wrapper">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
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
        <button class="action-btn primary" @click="$router.push({ name: 'home' })">กลับหน้าหลัก</button>
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
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCheckoutStore } from 'src/stores/checkoutStore';

const store = useCheckoutStore();
const route = useRoute();

onMounted(() => {
  const orderId = Number(route.params.orderId);
  if (orderId && !store.lastOrder) {
    void store.fetchOrder(orderId);
  }
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

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'รอชำระเงิน',
    paid: 'ชำระเงินแล้ว',
    shipped: 'จัดส่งแล้ว',
    shipping: 'กำลังจัดส่ง',
    delivered: 'ส่งถึงแล้ว',
    cancelled: 'ยกเลิก',
    refunded: 'คืนเงินแล้ว',
  };
  return map[status] ?? status;
};

const getImageUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API as string || 'http://localhost:3000';
  return `${base}${url}`;
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

.action-btn:active {
  transform: scale(0.98);
}

@media (max-width: 860px) {
  .success-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
}
</style>
