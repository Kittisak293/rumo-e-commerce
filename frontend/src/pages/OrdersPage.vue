<template>
  <q-page class="orders-page">
    <div class="orders-page__title">คำสั่งซื้อของฉัน</div>

    <div class="orders-page__toolbar">
      <div class="orders-page__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="orders-page__search-icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาเลขคำสั่งซื้อ หรือชื่อสินค้า" class="orders-page__search-input" />
      </div>
      <button type="button" class="orders-page__sort" @click="sortDesc = !sortDesc">
        เรียงโดย: {{ sortDesc ? 'ใหม่สุด' : 'เก่าสุด' }}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="#1d1d1d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <div class="orders-page__tabs">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        class="orders-page__tab"
        :class="{ 'orders-page__tab--active': store.statusFilter === tab.key }"
        @click="store.setStatusFilter(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.key && store.statusCounts[tab.key] > 0" class="orders-page__tab-count">{{ store.statusCounts[tab.key] }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="orders-page__list">
      <OrderCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="orders-page__state-card">
      <div class="orders-page__state-icon orders-page__state-icon--error">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </div>
      <div class="orders-page__state-title">โหลดคำสั่งซื้อไม่สำเร็จ</div>
      <div class="orders-page__state-sub">การเชื่อมต่อขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง</div>
      <div class="orders-page__error-banner">
        <div class="orders-page__error-banner-icon">!</div>
        <div>
          <div class="orders-page__error-banner-title">ไม่สามารถติดต่อเซิร์ฟเวอร์ได้</div>
          <div class="orders-page__error-banner-sub">{{ store.error }}</div>
        </div>
      </div>
      <button type="button" class="orders-page__cta" @click="load">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- Empty: never ordered -->
    <div v-else-if="store.orders.length === 0" class="orders-page__state-card">
      <div class="orders-page__state-icon orders-page__state-icon--empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M3 7h18M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 11v5M15 11v5" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="orders-page__state-title">ยังไม่มีคำสั่งซื้อ</div>
      <div class="orders-page__state-sub">เมื่อคุณสั่งซื้อสินค้า รายการทั้งหมดจะมาอยู่ที่นี่<br />พร้อมสถานะการจัดส่งแบบเรียลไทม์</div>
      <button type="button" class="orders-page__cta" @click="router.push({ name: 'home' })">เริ่มเลือกซื้อสินค้า</button>
    </div>

    <!-- Empty: has orders, current tab/search has none -->
    <div v-else-if="displayedOrders.length === 0" class="orders-page__state-card">
      <div class="orders-page__state-icon orders-page__state-icon--empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="#8e4dff" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div class="orders-page__state-title">ไม่พบคำสั่งซื้อในหมวดนี้</div>
      <div class="orders-page__state-sub">ลองเปลี่ยนตัวกรอง หรือล้างคำค้นหา</div>
      <button type="button" class="orders-page__cta" @click="resetFilters">ดูคำสั่งซื้อทั้งหมด</button>
    </div>

    <!-- List -->
    <div v-else class="orders-page__list">
      <OrderCard v-for="order in displayedOrders" :key="order.id" :order="order" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore, type OrderStatusFilter } from 'src/stores/orderStore';
import OrderCard from 'src/components/orders/OrderCard.vue';
import OrderCardSkeleton from 'src/components/orders/OrderCardSkeleton.vue';

const store = useOrderStore();
const router = useRouter();

const TABS: { key: OrderStatusFilter; label: string }[] = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอชำระเงิน' },
  { key: 'preparing', label: 'เตรียมจัดส่ง' },
  { key: 'shipping', label: 'กำลังจัดส่ง' },
  { key: 'delivered', label: 'ส่งถึงแล้ว' },
  { key: 'cancelled', label: 'ยกเลิก' },
];

const searchQuery = ref('');
const sortDesc = ref(true);

function load() {
  void store.fetchMyOrders();
}

onMounted(load);

function resetFilters() {
  store.setStatusFilter('');
  searchQuery.value = '';
}

const displayedOrders = computed(() => {
  let list = store.filteredOrders;
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (o) => o.orderNumber.toLowerCase().includes(q) || o.orderItems.some((i) => i.product.name.toLowerCase().includes(q)),
    );
  }
  return [...list].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDesc.value ? -diff : diff;
  });
});
</script>

<style scoped>
.orders-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.orders-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 18px;
}

.orders-page__toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.orders-page__search {
  position: relative;
  flex: 1;
  max-width: 340px;
  min-width: 200px;
}

.orders-page__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.orders-page__search-input {
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

.orders-page__search-input:focus {
  outline: none;
  border-color: #8e4dff;
}

.orders-page__sort {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.orders-page__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  overflow-x: auto;
  padding-bottom: 2px;
}

.orders-page__tab {
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
  flex-shrink: 0;
}

.orders-page__tab--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
}

.orders-page__tab-count {
  margin-left: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 1px 7px;
  border-radius: 999px;
}

.orders-page__tab--active .orders-page__tab-count {
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
}

.orders-page__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.orders-page__state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
  max-width: 460px;
  margin: 20px auto 0;
}

.orders-page__state-icon {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  animation: bounceIn 0.6s ease;
}

.orders-page__state-icon--empty {
  background: #ede9fe;
}

.orders-page__state-icon--error {
  background: #fee2e2;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.orders-page__state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.orders-page__state-sub {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 22px;
}

.orders-page__error-banner {
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

.orders-page__error-banner-icon {
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

.orders-page__error-banner-title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.orders-page__error-banner-sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.orders-page__cta {
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

@media (max-width: 860px) {
  .orders-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
}
</style>
