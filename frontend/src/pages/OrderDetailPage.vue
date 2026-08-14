<template>
  <q-page class="detail-page">
    <!-- Loading -->
    <div v-if="store.detailLoading" class="detail-page__skeleton">
      <div class="skeleton-card">
        <div class="skeleton-stepper">
          <div v-for="i in 4" :key="i" class="skeleton-bar" style="width: 36px; height: 36px; border-radius: 50%;" />
        </div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-bar" style="width: 40%; height: 15px; margin-bottom: 16px;" />
        <div v-for="i in 3" :key="i" style="display: flex; gap: 14px; padding: 10px 0;">
          <div class="skeleton-bar" style="width: 64px; height: 64px; border-radius: 12px; flex-shrink: 0;" />
          <div style="flex: 1;">
            <div class="skeleton-bar" style="width: 60%; height: 14px;" />
            <div class="skeleton-bar" style="width: 30%; height: 12px; margin-top: 8px;" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="store.detailError" class="detail-page__narrow">
      <div class="state-card">
        <div class="state-card__icon state-card__icon--error">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </div>
        <div class="state-card__title">ไม่พบข้อมูลคำสั่งซื้อ</div>
        <div class="state-card__sub">คำสั่งซื้อนี้อาจถูกลบ หรือไม่ได้เป็นของบัญชีนี้</div>
        <button type="button" class="state-card__btn state-card__btn--primary" @click="router.push({ name: 'orders' })">กลับไปรายการคำสั่งซื้อ</button>
        <button type="button" class="state-card__btn state-card__btn--secondary" @click="router.push({ name: 'home' })">กลับหน้าหลัก</button>
      </div>
    </div>

    <!-- Loaded -->
    <div v-else-if="order" class="detail-page__content">
      <div class="detail-page__breadcrumb">
        <router-link :to="{ name: 'orders' }">คำสั่งซื้อของฉัน</router-link>
        <span class="detail-page__breadcrumb-sep">/</span>
        {{ order.orderNumber }}
      </div>
      <div class="detail-page__header">
        <div class="detail-page__title">รายละเอียดคำสั่งซื้อ</div>
        <OrderStatusBadge :status="order.status" />
      </div>

      <div class="detail-grid">
        <div class="detail-grid__left">
          <!-- On-track: 4-step progress -->
          <div v-if="stepIndex !== null" class="card card--stepper">
            <OrderProgressStepper :current-step="stepIndex" :date-labels="stepDateLabels" />
          </div>

          <!-- Off-track: explanatory card instead of the stepper -->
          <div v-else class="card off-track-card">
            <div class="off-track-card__head">
              <div class="off-track-card__title">{{ offTrackMeta.title }}</div>
              <OrderStatusBadge :status="order.status" />
            </div>
            <div class="off-track-card__banner" :style="{ background: offTrackMeta.bg }">
              <div class="off-track-card__banner-icon" :style="{ background: offTrackMeta.iconBg }">{{ offTrackMeta.iconChar }}</div>
              <div>
                <div class="off-track-card__banner-title">{{ offTrackMeta.bannerTitle }}(อัปเดตล่าสุด {{ formatThaiDateTime(order.updatedAt) }})</div>
                <div class="off-track-card__banner-sub">{{ offTrackMeta.bannerSub }}</div>
              </div>
            </div>
            <button
              v-if="offTrackMeta.action"
              type="button"
              class="state-card__btn state-card__btn--primary"
              style="margin-top: 14px;"
              @click="offTrackMeta.action!.run()"
            >{{ offTrackMeta.action.label }}</button>
          </div>

          <div class="card">
            <div class="card__title">รายการสินค้า</div>
            <div v-for="item in order.orderItems" :key="item.id" class="item-row">
              <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name" class="item-row__img" />
              <div class="item-row__mid">
                <div class="item-row__name">{{ item.product.name }}</div>
                <div class="item-row__meta">฿{{ Number(item.price).toLocaleString() }} × {{ item.quantity }}</div>
              </div>
              <div class="item-row__total">฿{{ Number(item.lineTotal).toLocaleString() }}</div>
            </div>
          </div>

          <div class="card">
            <div class="card__title">ที่อยู่จัดส่ง</div>
            <div class="address-box">
              <div class="address-box__name">{{ order.address.fullName }} <span class="address-box__sep">|</span> {{ order.address.phone }}</div>
              <div class="address-box__lines">{{ order.address.subdistrict }}, {{ order.address.district }}, {{ order.address.province }} {{ order.address.postalCode }}</div>
            </div>
          </div>
        </div>

        <div class="detail-grid__right">
          <div v-if="primaryShipment" class="card">
            <div class="card__head">
              <div class="card__title" style="margin-bottom: 0;">พัสดุ</div>
              <span v-if="order.shipments.length > 1" class="parcel-count">1 จาก {{ order.shipments.length }} กล่อง</span>
            </div>
            <div class="parcel-box">
              <div class="parcel-box__label">ตำแหน่งล่าสุด</div>
              <div class="parcel-box__location">{{ primaryShipment.lastLocation ?? 'ยังไม่มีข้อมูล' }}</div>
              <div v-if="primaryShipment.estimatedDeliveryAt" class="parcel-box__eta">
                คาดว่าได้รับ <span class="parcel-box__eta-value">{{ formatThaiDate(primaryShipment.estimatedDeliveryAt) }}</span>
              </div>
            </div>
            <div class="kv-row">
              <span class="kv-row__key">ขนส่ง</span>
              <span class="kv-row__value">{{ primaryShipment.carrier.name }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-row__key">เลขพัสดุ</span>
              <span class="kv-row__value kv-row__value--mono">{{ primaryShipment.trackingNumber ?? '—' }}</span>
            </div>
            <button type="button" class="state-card__btn state-card__btn--primary" style="margin-top: 16px;" @click="goTracking">ติดตามพัสดุ</button>
          </div>

          <div class="card">
            <div class="card__title">สรุปยอด</div>
            <div class="summary-row">
              <span class="summary-row__label">ยอดรวมสินค้า ({{ order.totalQuantity }} ชิ้น)</span>
              <span class="summary-row__value">฿{{ Number(order.subtotal).toLocaleString() }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-row__label">ค่าจัดส่ง</span>
              <span class="summary-row__value" style="color: #16a34a;">ฟรี</span>
            </div>
            <div class="summary-divider" />
            <div class="summary-row summary-row--total">
              <span>ยอดรวม</span>
              <span class="summary-row__grand">฿{{ Number(order.total).toLocaleString() }}</span>
            </div>
            <div class="summary-row summary-row--meta">
              <span class="summary-row__label">วันที่สั่งซื้อ</span>
              <span class="kv-row__value">{{ formatThaiDateShort(order.createdAt) }}</span>
            </div>
            <button type="button" class="state-card__btn state-card__btn--secondary" style="margin-top: 16px;" @click="goReorder">ซื้ออีกครั้ง</button>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from 'src/stores/orderStore';
import { orderStepIndex, formatThaiDate, formatThaiDateTime, formatThaiDateShort } from 'src/composables/useOrderStatus';
import { getImageUrl } from 'src/utils/imageUrl';
import OrderStatusBadge from 'src/components/orders/OrderStatusBadge.vue';
import OrderProgressStepper from 'src/components/orders/OrderProgressStepper.vue';

const store = useOrderStore();
const route = useRoute();
const router = useRouter();

const orderId = computed(() => Number(route.params.orderId));

onMounted(() => {
  void store.fetchOrder(orderId.value);
});

const order = computed(() => store.orderDetail);
const stepIndex = computed(() => (order.value ? orderStepIndex(order.value.status) : null));
const primaryShipment = computed(() => order.value?.shipments[0] ?? null);

// Only the first two steps have a real timestamp on the detail response —
// "when did shipping start" / "when was it delivered" live on ShipmentEvent,
// which this endpoint doesn't load (see OrderTrackingPage for the full timeline).
const stepDateLabels = computed(() => {
  if (!order.value) return [];
  return [
    formatThaiDateShort(order.value.createdAt),
    primaryShipment.value ? formatThaiDateShort(primaryShipment.value.createdAt) : null,
    null,
    null,
  ];
});

function goTracking() {
  void router.push({ name: 'orderTracking', params: { orderId: orderId.value } });
}

function goReorder() {
  const productId = order.value?.orderItems[0]?.product.id;
  if (productId) void router.push({ name: 'productDetail', params: { id: productId } });
  else void router.push({ name: 'home' });
}

interface OffTrackMeta {
  title: string;
  bg: string;
  iconBg: string;
  iconChar: string;
  bannerTitle: string;
  bannerSub: string;
  action?: { label: string; run: () => void };
}

const offTrackMeta = computed<OffTrackMeta>(() => {
  const status = order.value?.status ?? 'pending';
  const retry = () => void router.push({ name: 'checkoutConfirm', query: { retryOrderId: String(orderId.value) } });
  switch (status) {
    case 'pending':
      return {
        title: 'รอการชำระเงิน',
        bg: '#fff7ed',
        iconBg: '#c2410c',
        iconChar: '!',
        bannerTitle: 'ยังไม่ได้ชำระเงิน ',
        bannerSub: 'คำสั่งซื้อจะถูกยกเลิกอัตโนมัติหากไม่ชำระเงินภายในเวลาที่กำหนด',
        action: { label: 'ชำระเงินตอนนี้', run: retry },
      };
    case 'processing':
      return {
        title: 'กำลังตรวจสอบการชำระเงิน',
        bg: '#f3f4f6',
        iconBg: '#6b7280',
        iconChar: 'i',
        bannerTitle: 'รอการยืนยันจาก Stripe ',
        bannerSub: 'กรุณารอสักครู่ ระบบจะอัปเดตสถานะให้อัตโนมัติ',
      };
    case 'failed':
      return {
        title: 'การชำระเงินไม่สำเร็จ',
        bg: '#fef2f2',
        iconBg: '#dc2626',
        iconChar: '!',
        bannerTitle: 'ชำระเงินไม่สำเร็จ ',
        bannerSub: 'ยังไม่มีการตัดเงินจากบัญชีของคุณ กรุณาลองชำระเงินอีกครั้ง',
        action: { label: 'ลองชำระเงินอีกครั้ง', run: retry },
      };
    case 'refunded':
      return {
        title: 'คำสั่งซื้อที่คืนเงินแล้ว',
        bg: '#fffbeb',
        iconBg: '#b45309',
        iconChar: 'i',
        bannerTitle: 'คืนเงินเรียบร้อยแล้ว ',
        bannerSub: 'ระบบดำเนินการคืนเงินให้เรียบร้อยแล้ว',
      };
    default:
      return {
        title: 'คำสั่งซื้อที่ถูกยกเลิก',
        bg: '#f9fafb',
        iconBg: '#9ca3af',
        iconChar: 'i',
        bannerTitle: 'ยกเลิกแล้ว ',
        bannerSub: 'ไม่มีพัสดุสำหรับคำสั่งซื้อนี้',
        action: { label: 'ซื้ออีกครั้ง', run: goReorder },
      };
  }
});
</script>

<style scoped>
.detail-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.detail-page__narrow {
  max-width: 460px;
  margin: 20px auto 0;
}

.detail-page__breadcrumb {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.detail-page__breadcrumb a {
  color: #8e4dff;
  text-decoration: none;
}

.detail-page__breadcrumb-sep {
  color: #d1d5db;
  margin: 0 4px;
}

.detail-page__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.detail-grid__left,
.detail-grid__right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.detail-grid__right {
  position: sticky;
  top: 24px;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.card--stepper {
  padding: 24px 20px 20px;
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.card__title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 14px;
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
  background: #f3f4f6;
  object-fit: cover;
  flex-shrink: 0;
}

.item-row__mid {
  flex: 1;
  min-width: 0;
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
}

.address-box {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
}

.address-box__name {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1d;
}

.address-box__sep {
  color: #d1d5db;
}

.address-box__lines {
  font-size: 13px;
  color: #6b7280;
  margin-top: 5px;
  line-height: 1.6;
}

.parcel-count {
  font-size: 11.5px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 999px;
}

.parcel-box {
  background: #f5f3ff;
  border-radius: 14px;
  padding: 14px;
}

.parcel-box__label {
  font-size: 12.5px;
  color: #8e4dff;
}

.parcel-box__location {
  font-size: 14px;
  font-weight: 600;
  color: #6d28d9;
  margin-top: 3px;
}

.parcel-box__eta {
  font-size: 12.5px;
  color: #8e4dff;
  margin-top: 8px;
}

.parcel-box__eta-value {
  font-weight: 600;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.kv-row__key {
  font-size: 13.5px;
  color: #6b7280;
  flex-shrink: 0;
}

.kv-row__value {
  font-size: 13.5px;
  color: #1d1d1d;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kv-row__value--mono {
  font-family: ui-monospace, Menlo, monospace;
  font-weight: 600;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-row__label {
  font-size: 14px;
  color: #6b7280;
}

.summary-row__value {
  font-size: 14px;
  color: #1d1d1d;
}

.summary-divider {
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
}

.summary-row--total {
  align-items: baseline;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
}

.summary-row__grand {
  font-size: 34px;
  font-weight: 700;
  color: #6d28d9;
  letter-spacing: -0.5px;
}

.summary-row--meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.off-track-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.off-track-card__title {
  font-size: 14.5px;
  font-weight: 600;
  color: #1d1d1d;
}

.off-track-card__banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 14px;
  padding: 13px;
}

.off-track-card__banner-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.off-track-card__banner-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1d;
}

.off-track-card__banner-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 3px;
  line-height: 1.5;
}

/* State card (not-found) */
.state-card {
  background: #fff;
  border-radius: 18px;
  padding: 34px 24px 26px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
}

.state-card__icon {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
}

.state-card__icon--error {
  background: #fee2e2;
}

.state-card__title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.state-card__sub {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
}

.state-card__btn {
  display: block;
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  box-sizing: border-box;
  border: none;
}

.state-card__btn--primary {
  color: #fff;
  background: #6d28d9;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  margin-bottom: 10px;
}

.state-card__btn--secondary {
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

/* Skeleton */
.detail-page__skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
}

.skeleton-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.skeleton-stepper {
  display: flex;
  justify-content: space-between;
  padding: 4px 20px;
}

.skeleton-bar {
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (max-width: 860px) {
  .detail-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-grid__right {
    position: static;
  }
}
</style>
