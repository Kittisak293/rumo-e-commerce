<template>
  <q-page class="ash-page">
    <div class="ash-page__header">
      <div>
        <div class="ash-page__title">คิวงานจัดส่ง</div>
        <div class="ash-page__sub">เรียงงานค้างนานสุดขึ้นก่อน</div>
      </div>
    </div>

    <div class="ash-toolbar">
      <div class="ash-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="ash-search__icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อลูกค้า หรือเลขพัสดุ" class="ash-search__input" />
      </div>
    </div>

    <div class="ash-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        class="ash-tab"
        :class="{ 'ash-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="ash-tab__count">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="ash-card">
      <div v-for="i in 4" :key="i" class="ash-skel-row">
        <div class="ash-skel-bar" style="width: 140px" />
        <div class="ash-skel-bar" style="width: 160px" />
        <div class="ash-skel-bar" style="width: 90px" />
        <div class="ash-skel-bar" style="width: 60px" />
        <div class="ash-skel-bar" style="width: 90px" />
        <div class="ash-skel-bar" style="width: 100px; border-radius: 999px" />
        <div class="ash-skel-bar" style="width: 100px; height: 36px; border-radius: 14px; margin-left: auto" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="ash-state-card">
      <div class="ash-error-banner">
        <div class="ash-error-banner__icon">!</div>
        <div>
          <div class="ash-error-banner__title">โหลดคิวงานจัดส่งไม่สำเร็จ</div>
          <div class="ash-error-banner__sub">{{ store.error }}</div>
        </div>
      </div>
      <button type="button" class="ash-cta" @click="load">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredOrders.length === 0" class="ash-state-card">
      <div class="ash-state-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L19 7" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="ash-state-title">เคลียร์งานหมดแล้ว</div>
      <div class="ash-state-sub">ไม่มีคำสั่งซื้อที่ต้องจัดการตอนนี้</div>
    </div>

    <!-- Table -->
    <div v-else class="ash-card">
      <table class="ash-table">
        <thead>
          <tr>
            <th>คำสั่งซื้อ</th>
            <th>ลูกค้า</th>
            <th>วันที่สั่ง</th>
            <th>ชิ้น</th>
            <th>ยอดรวม</th>
            <th>สถานะ</th>
            <th>พัสดุ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" class="ash-row">
            <td class="ash-td ash-td--strong">{{ order.orderNumber }}</td>
            <td class="ash-td">
              <div class="ash-customer-name">{{ order.user.name }}</div>
              <div class="ash-customer-email">{{ order.user.email }}</div>
            </td>
            <td class="ash-td">
              <div class="ash-date">{{ formatThaiDateShort(order.createdAt) }}</div>
              <div
                class="ash-days"
                :class="{ 'ash-days--warn': order.status === 'paid' && daysSince(order.createdAt) >= 2 }"
              >
                ค้าง {{ daysSince(order.createdAt) }} วัน
              </div>
            </td>
            <td class="ash-td">{{ order.totalQuantity }}</td>
            <td class="ash-td ash-td--amount">฿{{ Number(order.total).toLocaleString() }}</td>
            <td class="ash-td"><OrderStatusBadge :status="order.status" /></td>
            <td class="ash-td">
              <span class="ash-count-badge">{{ order.shipments.length }}</span>
            </td>
            <td class="ash-td ash-td--action">
              <button
                v-if="order.shipments.length === 0"
                type="button"
                class="ash-action-btn ash-action-btn--primary"
                @click="openCreate(order)"
              >
                + สร้างพัสดุ
              </button>
              <button v-else type="button" class="ash-action-btn ash-action-btn--secondary" @click="openEvent(order)">
                ดู/เพิ่ม event
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CreateShipmentDialog
      v-if="createTarget"
      v-model="createDialogOpen"
      :order="createTarget"
    />
    <AddShipmentEventDialog
      v-if="eventTarget && eventTarget.shipments[0]"
      v-model="eventDialogOpen"
      :order="eventTarget"
      :shipment="eventTarget.shipments[0]"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminShipmentStore } from 'src/stores/adminShipmentStore';
import type { AdminOrderData } from 'src/stores/adminShipmentStore';
import { formatThaiDateShort } from 'src/composables/useOrderStatus';
import OrderStatusBadge from 'src/components/orders/OrderStatusBadge.vue';
import CreateShipmentDialog from 'src/components/admin/CreateShipmentDialog.vue';
import AddShipmentEventDialog from 'src/components/admin/AddShipmentEventDialog.vue';

const store = useAdminShipmentStore();
const route = useRoute();

type Tab = '' | 'preparing' | 'shipping' | 'stuck';
const TABS: { key: Tab; label: string }[] = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'preparing', label: 'เตรียมจัดส่ง' },
  { key: 'shipping', label: 'กำลังจัดส่ง' },
  { key: 'stuck', label: 'พัสดุติดขัด' },
];
const activeTab = ref<Tab>('');
const searchQuery = ref('');

function isStuck(order: AdminOrderData): boolean {
  return order.shipments.some((s) => s.status === 'failed' || s.status === 'returned');
}

function matchesTab(order: AdminOrderData, tab: Tab): boolean {
  if (tab === 'preparing') return order.status === 'paid';
  if (tab === 'shipping') return ['shipped', 'shipping'].includes(order.status);
  if (tab === 'stuck') return isStuck(order);
  return true;
}

function tabCount(tab: Tab): number {
  return store.orders.filter((o) => matchesTab(o, tab)).length;
}

const filteredOrders = computed(() => {
  let list = store.orders.filter((o) => matchesTab(o, activeTab.value));
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q) ||
        o.shipments.some((s) => s.trackingNumber?.toLowerCase().includes(q)),
    );
  }
  return list;
});

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function load() {
  void store.fetchQueue();
  void store.fetchCarriers();
}

onMounted(() => {
  // Deep-linked from the admin dashboard's backlog cards, e.g. ?tab=stuck
  const requestedTab = route.query.tab;
  if (typeof requestedTab === 'string' && TABS.some((t) => t.key === requestedTab)) {
    activeTab.value = requestedTab as Tab;
  }
  load();
});

const createDialogOpen = ref(false);
const createTarget = ref<AdminOrderData | null>(null);
function openCreate(order: AdminOrderData) {
  createTarget.value = order;
  createDialogOpen.value = true;
}

const eventDialogOpen = ref(false);
const eventTargetId = ref<number | null>(null);
// Looked up by id (not a stored snapshot) so the dialog picks up fresh
// shipmentEvents after fetchQueue() re-runs on save, without closing itself.
const eventTarget = computed(() => store.orders.find((o) => o.id === eventTargetId.value) ?? null);
function openEvent(order: AdminOrderData) {
  eventTargetId.value = order.id;
  eventDialogOpen.value = true;
}
</script>

<style scoped>
.ash-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.ash-page__header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 18px;
}

.ash-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.ash-page__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.ash-page__carriers-link {
  padding: 11px 18px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 13.5px;
  font-weight: 600;
  color: #6b7280;
  box-sizing: border-box;
  text-decoration: none;
  white-space: nowrap;
}

.ash-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.ash-search {
  position: relative;
  flex: 1;
  max-width: 400px;
  min-width: 200px;
}

.ash-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.ash-search__input {
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

.ash-search__input:focus {
  outline: none;
  border-color: #8e4dff;
}

.ash-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.ash-tab {
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

.ash-tab--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
}

.ash-tab__count {
  margin-left: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 1px 7px;
  border-radius: 999px;
}

.ash-tab--active .ash-tab__count {
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
}

.ash-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.ash-table {
  width: 100%;
  border-collapse: collapse;
}

.ash-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  padding: 0 10px 10px;
}

.ash-row:hover {
  background: #fafafa;
}

.ash-td {
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
  font-size: 13.5px;
  color: #1d1d1d;
  vertical-align: middle;
}

.ash-td--strong {
  font-weight: 600;
  white-space: nowrap;
}

.ash-td--amount {
  font-weight: 600;
  color: #6d28d9;
  white-space: nowrap;
}

.ash-td--action {
  text-align: right;
}

.ash-customer-name {
  font-size: 13.5px;
  color: #1d1d1d;
}

.ash-customer-email {
  font-size: 12px;
  color: #9ca3af;
}

.ash-date {
  font-size: 13px;
  color: #1d1d1d;
  white-space: nowrap;
}

.ash-days {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 4px;
}

.ash-days--warn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #c2410c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  padding: 2px 9px;
}

.ash-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 999px;
}

.ash-action-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.ash-action-btn--primary {
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.ash-action-btn--secondary {
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
}

.ash-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
  max-width: 460px;
  margin: 20px auto 0;
}

.ash-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.ash-state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.ash-state-sub {
  font-size: 13.5px;
  color: #6b7280;
}

.ash-error-banner {
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

.ash-error-banner__icon {
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

.ash-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.ash-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.ash-cta {
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

.ash-skel-row {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
}

.ash-skel-row:first-child {
  border-top: none;
}

.ash-skel-bar {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: ash-shimmer 1.4s ease infinite;
}

@keyframes ash-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (max-width: 860px) {
  .ash-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .ash-card {
    overflow-x: auto;
  }

  .ash-table {
    min-width: 720px;
  }
}
</style>
