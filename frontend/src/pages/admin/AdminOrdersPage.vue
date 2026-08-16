<template>
  <q-page class="ado-page">
    <div class="ado-page__header">
      <div>
        <div class="ado-page__title">จัดการคำสั่งซื้อ</div>
        <div class="ado-page__sub">ทะเบียนคำสั่งซื้อทั้งหมด</div>
      </div>
    </div>

    <div class="ado-toolbar">
      <div class="ado-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="ado-search__icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อลูกค้า หรืออีเมล"
          class="ado-search__input"
        />
      </div>
      <button
        v-if="hasActiveFilter"
        type="button"
        class="ado-clear-btn"
        @click="clearFilters"
      >
        ล้างตัวกรอง
      </button>
    </div>

    <div class="ado-tabs">
      <button
        v-for="group in GROUPS"
        :key="group.key"
        type="button"
        class="ado-tab"
        :class="{ 'ado-tab--active': activeGroup === group.key }"
        @click="selectGroup(group.key)"
      >
        {{ group.label }}
        <span class="ado-tab__count">{{ groupCount(group.key) }}</span>
      </button>
    </div>

    <div v-if="activeSubStatuses.length > 1" class="ado-subtabs">
      <button
        v-for="status in activeSubStatuses"
        :key="status"
        type="button"
        class="ado-subtab"
        :class="{ 'ado-subtab--active': activeStatus === status }"
        @click="selectStatus(status)"
      >
        {{ getStatusLabel(status) }}
        <span class="ado-subtab__count">{{ statusCount(status) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="ado-card">
      <div v-for="i in 5" :key="i" class="ado-skel-row">
        <div class="ado-skel-bar" style="width: 150px" />
        <div class="ado-skel-bar" style="width: 170px" />
        <div class="ado-skel-bar" style="width: 110px" />
        <div class="ado-skel-bar" style="width: 40px" />
        <div class="ado-skel-bar" style="width: 90px" />
        <div class="ado-skel-bar" style="width: 100px; border-radius: 999px" />
        <div class="ado-skel-bar" style="width: 110px; height: 34px; border-radius: 14px; margin-left: auto" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="ado-state-card">
      <div class="ado-error-banner">
        <div class="ado-error-banner__icon">!</div>
        <div>
          <div class="ado-error-banner__title">โหลดรายการคำสั่งซื้อไม่สำเร็จ</div>
          <div class="ado-error-banner__sub">{{ store.error }}</div>
        </div>
      </div>
      <button type="button" class="ado-cta" @click="load">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- No orders at all -->
    <div v-else-if="store.orders.length === 0" class="ado-state-card">
      <div class="ado-state-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="ado-state-title">ยังไม่มีคำสั่งซื้อในระบบ</div>
      <div class="ado-state-sub">เมื่อมีลูกค้าสั่งซื้อ รายการจะปรากฏที่นี่</div>
    </div>

    <!-- Search / filter has no results -->
    <div v-else-if="filteredOrders.length === 0" class="ado-state-card">
      <div class="ado-state-icon ado-state-icon--muted">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div class="ado-state-title">ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง</div>
      <div class="ado-state-sub">ลองปรับคำค้นหาหรือเปลี่ยนตัวกรองสถานะ</div>
      <button type="button" class="ado-clear-btn ado-clear-btn--center" @click="clearFilters">ล้างตัวกรอง</button>
    </div>

    <!-- Table -->
    <div v-else class="ado-card">
      <table class="ado-table">
        <thead>
          <tr>
            <th>เลขคำสั่งซื้อ</th>
            <th>ลูกค้า</th>
            <th>วันที่สั่ง</th>
            <th>ชิ้น</th>
            <th>ยอดรวม</th>
            <th>สถานะ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" class="ado-row">
            <td class="ado-td ado-td--strong">{{ order.orderNumber }}</td>
            <td class="ado-td">
              <div class="ado-customer-name">{{ order.user.name }}</div>
              <div class="ado-customer-email">{{ order.user.email }}</div>
            </td>
            <td class="ado-td ado-td--date">{{ formatThaiDateTime(order.createdAt) }}</td>
            <td class="ado-td">{{ order.totalQuantity }}</td>
            <td class="ado-td ado-td--amount">฿{{ Number(order.total).toLocaleString() }}</td>
            <td class="ado-td"><OrderStatusBadge :status="order.status" /></td>
            <td class="ado-td ado-td--action">
              <button type="button" class="ado-action-btn" @click="openDetail(order.id)">ดูรายละเอียด</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail drawer -->
    <Transition name="ado-fade">
      <div v-if="detailOpen" class="ado-overlay" @click="closeDetail" />
    </Transition>
    <Transition name="ado-slide">
      <aside v-if="detailOpen" class="ado-drawer">
        <div v-if="store.detailLoading" class="ado-drawer__loading">
          <div v-for="i in 4" :key="i" class="ado-skel-bar" style="width: 100%; height: 16px; margin-bottom: 14px" />
        </div>

        <div v-else-if="store.detailError" class="ado-drawer__error">
          <div class="ado-error-banner">
            <div class="ado-error-banner__icon">!</div>
            <div>
              <div class="ado-error-banner__title">โหลดรายละเอียดไม่สำเร็จ</div>
              <div class="ado-error-banner__sub">{{ store.detailError }}</div>
            </div>
          </div>
          <button type="button" class="ado-cta" @click="detailOrderId && store.fetchOne(detailOrderId)">ลองใหม่อีกครั้ง</button>
        </div>

        <div v-else-if="store.detail" class="ado-drawer__body">
          <div class="ado-drawer__header">
            <div>
              <div class="ado-drawer__order-number">{{ store.detail.orderNumber }}</div>
              <div class="ado-drawer__header-meta">
                <OrderStatusBadge :status="store.detail.status" />
                <span class="ado-drawer__date">{{ formatThaiDateTime(store.detail.createdAt) }}</span>
              </div>
            </div>
            <button type="button" class="ado-close-btn" aria-label="ปิด" @click="closeDetail">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="ado-section">
            <div class="ado-section__title">ลูกค้า</div>
            <div class="ado-customer-name">{{ store.detail.user.name }}</div>
            <div class="ado-customer-email">{{ store.detail.user.email }}</div>
          </div>

          <div class="ado-section">
            <div class="ado-section__title">ที่อยู่จัดส่ง</div>
            <div class="ado-address">
              {{ store.detail.address.fullName }} · {{ store.detail.address.phone }}
            </div>
            <div class="ado-address">
              ตำบล{{ store.detail.address.subdistrict }} อำเภอ{{ store.detail.address.district }}
              จังหวัด{{ store.detail.address.province }} {{ store.detail.address.postalCode }}
            </div>
          </div>

          <div class="ado-section">
            <div class="ado-section__title">รายการสินค้า</div>
            <div v-for="item in store.detail.orderItems" :key="item.id" class="ado-item-row">
              <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name" class="ado-item-row__img" />
              <div class="ado-item-row__mid">
                <div class="ado-item-row__name">{{ item.product.name }}</div>
                <div class="ado-item-row__meta">฿{{ Number(item.price).toLocaleString() }} × {{ item.quantity }}</div>
              </div>
              <div class="ado-item-row__total">฿{{ Number(item.lineTotal).toLocaleString() }}</div>
            </div>
          </div>

          <div class="ado-section">
            <div class="ado-section__title">สรุปยอด</div>
            <div class="ado-summary-row">
              <span>ยอดสินค้า</span>
              <span>฿{{ Number(store.detail.subtotal).toLocaleString() }}</span>
            </div>
            <div class="ado-summary-row">
              <span>ค่าจัดส่ง</span>
              <span>฿{{ Number(store.detail.shippingFee).toLocaleString() }}</span>
            </div>
            <div class="ado-summary-row ado-summary-row--total">
              <span>ยอดรวม</span>
              <span>฿{{ Number(store.detail.total).toLocaleString() }}</span>
            </div>
          </div>

          <div class="ado-section">
            <div class="ado-section__title">พัสดุ</div>
            <template v-if="store.detail.shipments.length > 0">
              <div v-for="shipment in store.detail.shipments" :key="shipment.id" class="ado-shipment">
                <div class="ado-shipment__row">
                  <span class="ado-shipment__label">เลขพัสดุ</span>
                  <span class="ado-shipment__value">{{ shipment.trackingNumber || '—' }}</span>
                </div>
                <div class="ado-shipment__row">
                  <span class="ado-shipment__label">บริษัทขนส่ง</span>
                  <span class="ado-shipment__value">{{ shipment.carrier.name }}</span>
                </div>
                <div class="ado-shipment__row">
                  <span class="ado-shipment__label">สถานะพัสดุ</span>
                  <ShipmentStatusPill :status="shipment.status" />
                </div>
                <a
                  v-if="shipmentTrackingLink(shipment)"
                  :href="shipmentTrackingLink(shipment)!"
                  target="_blank"
                  rel="noopener"
                  class="ado-shipment__link"
                >
                  ไปหน้าติดตามพัสดุ
                </a>
              </div>
            </template>
            <div v-else class="ado-no-shipment">
              <div class="ado-no-shipment__text">ยังไม่มีพัสดุ</div>
              <router-link :to="{ name: 'adminShipments' }" class="ado-shipment__link">ไปที่คิวงานจัดส่ง</router-link>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminOrderStore } from 'src/stores/adminOrderStore';
import type { OrderListItem } from 'src/stores/adminOrderStore';
import type { ShipmentData } from 'src/stores/orderStore';
import { formatThaiDateTime, getStatusLabel } from 'src/composables/useOrderStatus';
import { getImageUrl } from 'src/utils/imageUrl';
import { previewTrackingUrl } from 'src/utils/trackingUrl';
import OrderStatusBadge from 'src/components/orders/OrderStatusBadge.vue';
import ShipmentStatusPill from 'src/components/admin/ShipmentStatusPill.vue';

const store = useAdminOrderStore();
const route = useRoute();

type GroupKey = 'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'problem';
const GROUPS: { key: GroupKey; label: string; statuses: string[] }[] = [
  { key: 'all', label: 'ทั้งหมด', statuses: [] },
  { key: 'pending', label: 'รอชำระเงิน', statuses: ['pending'] },
  { key: 'preparing', label: 'กำลังเตรียม', statuses: ['processing', 'paid'] },
  { key: 'shipping', label: 'กำลังจัดส่ง', statuses: ['shipped', 'shipping'] },
  { key: 'delivered', label: 'สำเร็จ', statuses: ['delivered'] },
  { key: 'problem', label: 'มีปัญหา', statuses: ['failed', 'cancelled', 'refunded'] },
];

const activeGroup = ref<GroupKey>('all');
const activeStatus = ref<string | null>(null);
const searchQuery = ref('');

function selectGroup(key: GroupKey) {
  activeGroup.value = key;
  activeStatus.value = null;
}

function selectStatus(status: string) {
  activeStatus.value = activeStatus.value === status ? null : status;
}

const activeSubStatuses = computed(
  () => GROUPS.find((g) => g.key === activeGroup.value)?.statuses ?? [],
);

function matchesGroup(status: string, key: GroupKey): boolean {
  const group = GROUPS.find((g) => g.key === key);
  if (!group || group.statuses.length === 0) return true;
  return group.statuses.includes(status);
}

function groupCount(key: GroupKey): number {
  return store.orders.filter((o) => matchesGroup(o.status, key)).length;
}

function statusCount(status: string): number {
  return store.orders.filter((o) => o.status === status).length;
}

const hasActiveFilter = computed(
  () => activeGroup.value !== 'all' || activeStatus.value !== null || searchQuery.value.trim() !== '',
);

function clearFilters() {
  activeGroup.value = 'all';
  activeStatus.value = null;
  searchQuery.value = '';
}

const filteredOrders = computed(() => {
  let list = store.orders;
  if (activeStatus.value) {
    list = list.filter((o) => o.status === activeStatus.value);
  } else if (activeGroup.value !== 'all') {
    list = list.filter((o) => matchesGroup(o.status, activeGroup.value));
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (o: OrderListItem) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q),
    );
  }
  return list;
});

function load() {
  void store.fetchAll();
}

onMounted(() => {
  // Deep-linked from the admin dashboard's backlog cards, e.g. ?group=pending
  const requestedGroup = route.query.group;
  if (typeof requestedGroup === 'string' && GROUPS.some((g) => g.key === requestedGroup)) {
    activeGroup.value = requestedGroup as GroupKey;
  }
  load();
});

const detailOpen = ref(false);
const detailOrderId = ref<number | null>(null);

function openDetail(id: number) {
  detailOrderId.value = id;
  detailOpen.value = true;
  void store.fetchOne(id);
}

function closeDetail() {
  detailOpen.value = false;
  store.clearDetail();
}

function shipmentTrackingLink(shipment: ShipmentData): string | null {
  if (!shipment.trackingNumber || !shipment.carrier.trackingUrlTemplate) return null;
  return previewTrackingUrl(shipment.carrier.trackingUrlTemplate, shipment.trackingNumber);
}
</script>

<style scoped>
.ado-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.ado-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.ado-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.ado-page__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.ado-page__count {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.ado-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.ado-search {
  position: relative;
  flex: 1;
  max-width: 400px;
  min-width: 200px;
}

.ado-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.ado-search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px 11px 40px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
}

.ado-search__input:focus {
  outline: none;
  border-color: #8e4dff;
}

.ado-clear-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.ado-clear-btn--center {
  margin: 16px auto 0;
}

.ado-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.ado-tab {
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.ado-tab--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
}

.ado-tab__count {
  margin-left: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 1px 7px;
  border-radius: 999px;
}

.ado-tab--active .ado-tab__count {
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
}

.ado-subtabs {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  padding-left: 4px;
}

.ado-subtab {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  color: #6b7280;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.ado-subtab--active {
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  border-color: #ddd6fe;
}

.ado-subtab__count {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  opacity: 0.8;
}

.ado-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.ado-table {
  width: 100%;
  border-collapse: collapse;
}

.ado-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  padding: 0 10px 10px;
}

.ado-row:hover {
  background: #fafafa;
}

.ado-td {
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
  font-size: 13.5px;
  color: #1d1d1d;
  vertical-align: middle;
}

.ado-td--strong {
  font-weight: 600;
  white-space: nowrap;
}

.ado-td--date {
  white-space: nowrap;
}

.ado-td--amount {
  font-weight: 600;
  color: #6d28d9;
  white-space: nowrap;
}

.ado-td--action {
  text-align: right;
}

.ado-customer-name {
  font-size: 13.5px;
  color: #1d1d1d;
}

.ado-customer-email {
  font-size: 12px;
  color: #9ca3af;
}

.ado-action-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
}

.ado-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
  max-width: 460px;
  margin: 20px auto 0;
}

.ado-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.ado-state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.ado-state-sub {
  font-size: 13.5px;
  color: #6b7280;
}

.ado-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
}

.ado-error-banner__icon {
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

.ado-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.ado-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.ado-cta {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  font-family: inherit;
  box-sizing: border-box;
}

.ado-skel-row {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
}

.ado-skel-row:first-child {
  border-top: none;
}

.ado-skel-bar {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: ado-shimmer 1.4s ease infinite;
}

@keyframes ado-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* Detail drawer */

.ado-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  z-index: 1000;
}

.ado-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: #fff;
  box-shadow: -8px 0 28px rgba(0, 0, 0, 0.12);
  z-index: 1001;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}

.ado-fade-enter-active,
.ado-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ado-fade-enter-from,
.ado-fade-leave-to {
  opacity: 0;
}

.ado-slide-enter-active,
.ado-slide-leave-active {
  transition: transform 0.25s ease;
}

.ado-slide-enter-from,
.ado-slide-leave-to {
  transform: translateX(100%);
}

.ado-drawer__loading,
.ado-drawer__error {
  padding-top: 8px;
}

.ado-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.ado-drawer__order-number {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1d;
  white-space: nowrap;
}

.ado-drawer__header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.ado-drawer__date {
  font-size: 12.5px;
  color: #9ca3af;
}

.ado-close-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ado-section {
  padding: 16px 0;
  border-top: 1px solid #f3f4f6;
}

.ado-section:first-of-type {
  border-top: none;
}

.ado-section__title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 10px;
}

.ado-address {
  font-size: 13.5px;
  color: #1d1d1d;
  line-height: 1.6;
}

.ado-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.ado-item-row__img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f3f4f6;
}

.ado-item-row__mid {
  flex: 1;
  min-width: 0;
}

.ado-item-row__name {
  font-size: 13.5px;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ado-item-row__meta {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.ado-item-row__total {
  font-size: 13.5px;
  font-weight: 600;
  color: #1d1d1d;
  white-space: nowrap;
}

.ado-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  color: #6b7280;
  padding: 4px 0;
}

.ado-summary-row--total {
  font-size: 15px;
  font-weight: 600;
  color: #6d28d9;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.ado-shipment {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.ado-shipment__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
}

.ado-shipment__label {
  color: #9ca3af;
}

.ado-shipment__value {
  color: #1d1d1d;
  font-weight: 600;
}

.ado-shipment__link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6d28d9;
  text-decoration: none;
}

.ado-no-shipment {
  background: #fafafa;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}

.ado-no-shipment__text {
  font-size: 13.5px;
  color: #6b7280;
  margin-bottom: 6px;
}

@media (max-width: 860px) {
  .ado-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .ado-card {
    overflow-x: auto;
  }

  .ado-table {
    min-width: 720px;
  }

  .ado-drawer {
    width: 100vw;
  }
}
</style>
