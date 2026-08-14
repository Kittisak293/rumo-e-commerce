<template>
  <q-page class="tracking-page">
    <div class="tracking-page__topbar">
      <button type="button" class="tracking-page__back" @click="router.push({ name: 'orderDetail', params: { orderId } })">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="#1d1d1d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="tracking-page__topbar-text">
        <div class="tracking-page__topbar-title">ติดตามพัสดุ</div>
        <div class="tracking-page__topbar-sub">{{ displayOrderNumber }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.trackingLoading" class="tracking-page__skeleton">
      <div class="skeleton-header" />
      <div class="skeleton-card">
        <div v-for="i in 3" :key="i" style="display: flex; gap: 16px; margin-bottom: 18px;">
          <div class="skeleton-bar" style="width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;" />
          <div style="flex: 1;">
            <div class="skeleton-bar" style="width: 60%; height: 14px;" />
            <div class="skeleton-bar" style="width: 40%; height: 12px; margin-top: 8px;" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error (request itself failed) -->
    <div v-else-if="store.trackingError && !store.tracking" class="tracking-page__narrow">
      <div class="state-card">
        <div class="state-card__icon state-card__icon--error">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </div>
        <div class="state-card__title">ดึงสถานะพัสดุไม่สำเร็จ</div>
        <div class="state-card__sub">ระบบเชื่อมต่อไม่สำเร็จในตอนนี้ กรุณาลองใหม่อีกครั้ง</div>

        <div class="error-banner">
          <div class="error-banner__icon">!</div>
          <div class="error-banner__text">
            <div class="error-banner__title">TRACKING_UNAVAILABLE</div>
            <div class="error-banner__sub">{{ store.trackingError }}</div>
          </div>
        </div>

        <!-- Best-effort: reuse whatever we already fetched on the detail page in this session -->
        <div v-if="fallbackShipment" class="tracking-number-box">
          <div class="tracking-number-box__label">เลขพัสดุในระบบ</div>
          <div class="tracking-number-box__row">
            <span class="tracking-number-box__value">{{ fallbackShipment.trackingNumber }}</span>
            <button type="button" class="tracking-number-box__copy" @click="copyFallback">{{ fallbackCopied ? 'คัดลอกแล้ว' : 'คัดลอก' }}</button>
          </div>
        </div>

        <button type="button" class="state-card__btn state-card__btn--primary" @click="load">ลองใหม่อีกครั้ง</button>
        <a
          v-if="fallbackShipment?.trackingUrl"
          :href="fallbackShipment.trackingUrl"
          target="_blank"
          rel="noopener"
          class="state-card__btn state-card__btn--secondary state-card__btn--link"
        >เช็คบนเว็บ {{ fallbackShipment.carrier.name }}</a>
      </div>
    </div>

    <!-- Loaded -->
    <div v-else-if="tracking" class="tracking-page__content">
      <div class="tracking-page__breadcrumb">
        <router-link :to="{ name: 'orders' }">คำสั่งซื้อของฉัน</router-link>
        <span class="sep">/</span>
        <router-link :to="{ name: 'orderDetail', params: { orderId } }">{{ tracking.orderNumber }}</router-link>
        <span class="sep">/</span>
        ติดตามพัสดุ
      </div>
      <div class="tracking-page__title">ติดตามพัสดุ</div>

      <!-- Empty: no shipment yet -->
      <div v-if="tracking.shipments.length === 0" class="tracking-page__narrow">
        <div class="state-card">
          <div class="state-card__icon state-card__icon--empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 7h18M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 11v5M15 11v5" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="state-card__title">ยังไม่มีเลขพัสดุ</div>
          <div class="state-card__sub">ร้านค้ากำลังเตรียมสินค้าอยู่ ระบบจะแสดงเลขพัสดุและเส้นทางการเดินทางทันทีที่ส่งเข้าระบบขนส่ง</div>
          <div class="info-banner">
            <div class="info-banner__icon">i</div>
            <div class="info-banner__text">ชำระเงินแล้วเมื่อ {{ formatThaiDateTime(tracking.createdAt) }}</div>
          </div>
          <button type="button" class="state-card__btn state-card__btn--primary" @click="router.push({ name: 'orderDetail', params: { orderId } })">ดูรายละเอียดคำสั่งซื้อ</button>
          <button type="button" class="state-card__btn state-card__btn--secondary" @click="router.push({ name: 'orders' })">กลับไปรายการคำสั่งซื้อ</button>
        </div>
      </div>

      <!-- Shipments -->
      <div v-else class="tracking-grid">
        <div class="tracking-grid__left">
          <div v-for="(shipment, index) in tracking.shipments" :key="shipment.id" class="parcel-block">
            <div v-if="tracking.shipments.length > 1" class="parcel-block__label">กล่อง {{ index + 1 }} / {{ tracking.shipments.length }}</div>
            <TrackingHeaderCard
              :status="shipment.status"
              :last-location="shipment.lastLocation"
              :estimated-delivery-at="shipment.estimatedDeliveryAt"
              :carrier-name="shipment.carrier.name"
              :tracking-number="shipment.trackingNumber"
              :tracking-url="shipment.trackingUrl ?? null"
            />
            <div class="card">
              <div class="card__title">ประวัติการเดินทางของพัสดุ</div>
              <div class="card__subtitle">เรียงจากเหตุการณ์ล่าสุด</div>
              <ShipmentTimeline v-if="shipment.shipmentEvents?.length" :events="shipment.shipmentEvents" />
              <div v-else class="card__empty-note">ยังไม่มีประวัติการเดินทาง</div>
            </div>
          </div>
        </div>

        <div class="tracking-grid__right">
          <div class="card">
            <!-- OrderItem has no shipment link in the data model, so this lists
                 everything in the order rather than a true per-parcel split. -->
            <div class="card__title">สินค้าในคำสั่งซื้อนี้</div>
            <div v-for="item in tracking.orderItems" :key="item.id" class="mini-item-row">
              <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name" class="mini-item-row__img" />
              <div class="mini-item-row__mid">
                <div class="mini-item-row__name">{{ item.product.name }}</div>
                <div class="mini-item-row__qty">x{{ item.quantity }}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__title" style="margin-bottom: 12px;">จัดส่งถึง</div>
            <div class="address-name">{{ tracking.address.fullName }}</div>
            <div class="address-phone">{{ tracking.address.phone }}</div>
            <div class="address-lines">{{ tracking.address.subdistrict }}, {{ tracking.address.district }}, {{ tracking.address.province }} {{ tracking.address.postalCode }}</div>
          </div>

          <button type="button" class="state-card__btn state-card__btn--secondary" @click="router.push({ name: 'orderDetail', params: { orderId } })">ดูรายละเอียดคำสั่งซื้อ</button>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from 'src/stores/orderStore';
import { formatThaiDateTime } from 'src/composables/useOrderStatus';
import { getImageUrl } from 'src/utils/imageUrl';
import TrackingHeaderCard from 'src/components/orders/TrackingHeaderCard.vue';
import ShipmentTimeline from 'src/components/orders/ShipmentTimeline.vue';

const store = useOrderStore();
const route = useRoute();
const router = useRouter();

const orderId = computed(() => Number(route.params.orderId));
const tracking = computed(() => store.tracking);

function load() {
  void store.fetchTracking(orderId.value);
}

onMounted(load);

// Best-effort fallback when the tracking call itself fails: if the detail
// page already loaded this same order in this session, its shipment data is
// still sitting in the store and is worth showing rather than nothing.
const fallbackShipment = computed(() => {
  if (store.orderDetail?.id !== orderId.value) return null;
  return store.orderDetail.shipments[0] ?? null;
});

const displayOrderNumber = computed(
  () => tracking.value?.orderNumber ?? store.orderDetail?.orderNumber ?? '',
);

const fallbackCopied = ref(false);
async function copyFallback() {
  if (!fallbackShipment.value?.trackingNumber) return;
  await navigator.clipboard.writeText(fallbackShipment.value.trackingNumber);
  fallbackCopied.value = true;
  setTimeout(() => {
    fallbackCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.tracking-page {
  padding: 20px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.tracking-page__topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.tracking-page__back {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.tracking-page__topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
}

.tracking-page__topbar-sub {
  font-size: 11.5px;
  color: #9ca3af;
}

.tracking-page__breadcrumb {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.tracking-page__breadcrumb a {
  color: #8e4dff;
  text-decoration: none;
}

.tracking-page__breadcrumb .sep {
  color: #d1d5db;
  margin: 0 4px;
}

.tracking-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 20px;
}

.tracking-page__narrow {
  max-width: 460px;
  margin: 20px auto 0;
}

.tracking-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.tracking-grid__left,
.tracking-grid__right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.parcel-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parcel-block__label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 22px 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.card__title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.card__subtitle {
  font-size: 12.5px;
  color: #9ca3af;
  margin-bottom: 18px;
}

.card__empty-note {
  font-size: 13px;
  color: #9ca3af;
}

.mini-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #f9fafb;
}

.mini-item-row:last-child {
  border-bottom: none;
}

.mini-item-row__img {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: #f3f4f6;
  object-fit: cover;
  flex-shrink: 0;
}

.mini-item-row__mid {
  flex: 1;
  min-width: 0;
}

.mini-item-row__name {
  font-size: 13.5px;
  font-weight: 500;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-item-row__qty {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.address-name {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1d;
}

.address-phone {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.address-lines {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.6;
}

/* State card (empty / error) */
.state-card {
  background: #fff;
  border-radius: 18px;
  padding: 30px 20px 22px;
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
  animation: bounceIn 0.6s ease;
}

.state-card__icon--empty {
  background: #ede9fe;
}

.state-card__icon--error {
  background: #fee2e2;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
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
  margin-bottom: 18px;
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
  margin-bottom: 10px;
  text-decoration: none;
  text-align: center;
}

.state-card__btn:last-child {
  margin-bottom: 0;
}

.state-card__btn--primary {
  color: #fff;
  background: #6d28d9;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.state-card__btn--secondary {
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
}

.info-banner__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #c2410c;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-banner__text {
  font-size: 12.5px;
  color: #c2410c;
  line-height: 1.5;
}

.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
  text-align: left;
}

.error-banner__icon {
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

.error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.tracking-number-box {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 13px 14px;
  margin-bottom: 18px;
  text-align: left;
}

.tracking-number-box__label {
  font-size: 12px;
  color: #9ca3af;
}

.tracking-number-box__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 5px;
}

.tracking-number-box__value {
  font-size: 15px;
  font-weight: 700;
  color: #1d1d1d;
  font-family: ui-monospace, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tracking-number-box__copy {
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

/* Skeleton */
.tracking-page__skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
}

.skeleton-header {
  height: 150px;
  border-radius: 18px;
  background: linear-gradient(90deg, #a78bfa 25%, #8e4dff 37%, #a78bfa 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

.skeleton-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
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
  .tracking-page {
    padding: 16px 16px 40px;
    max-width: 100%;
  }
  .tracking-grid {
    grid-template-columns: 1fr;
  }
}
</style>
