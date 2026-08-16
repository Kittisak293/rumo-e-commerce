<template>
  <q-page class="adb-page">
    <div class="adb-header">
      <div>
        <div class="adb-header__title">ภาพรวมแอดมิน</div>
        <div class="adb-header__sub">ยอดขาย · งานค้างที่ต้องทำตอนนี้</div>
      </div>
    </div>

    <!-- ===== Block 2: Sales summary ===== -->
    <section class="adb-card adb-sales">
      <div class="adb-sales__head">
        <div class="adb-section-title">สรุปยอดขาย</div>
        <div class="adb-range-tabs">
          <button
            v-for="opt in RANGE_OPTIONS"
            :key="opt.key"
            type="button"
            class="adb-range-tab"
            :class="{ 'adb-range-tab--active': activeRange === opt.key }"
            @click="activeRange = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="adb-sales__scope-note">ตัวเลือกช่วงเวลานี้คุมเฉพาะยอดขายด้านล่าง — งานค้างด้านล่างสุดคือ ณ ปัจจุบันเสมอ</div>

      <div v-if="orderStore.loading" class="adb-sales__skel">
        <div class="adb-skel-bar" style="width: 120px; height: 28px; margin-bottom: 8px" />
        <div class="adb-skel-metrics">
          <div class="adb-skel-bar" style="width: 100%; height: 60px" />
          <div class="adb-skel-bar" style="width: 100%; height: 60px" />
          <div class="adb-skel-bar" style="width: 100%; height: 60px" />
        </div>
        <div class="adb-skel-bar" style="width: 100%; height: 140px; margin-top: 16px" />
      </div>

      <div v-else-if="orderStore.error" class="adb-inline-error">
        <div class="adb-error-banner">
          <div class="adb-error-banner__icon">!</div>
          <div>
            <div class="adb-error-banner__title">โหลดข้อมูลยอดขายไม่สำเร็จ</div>
            <div class="adb-error-banner__sub">{{ orderStore.error }}</div>
          </div>
        </div>
        <button type="button" class="adb-retry-btn" @click="orderStore.fetchAll()">ลองใหม่อีกครั้ง</button>
      </div>

      <template v-else>
        <div class="adb-metrics">
          <div class="adb-metric">
            <div class="adb-metric__label">ยอดขายรวม</div>
            <div class="adb-metric__value adb-metric__value--brand">฿{{ salesTotal.toLocaleString() }}</div>
            <div class="adb-metric__compare" :class="compareClass(salesTotal, prevSalesTotal)">
              {{ compareText(salesTotal, prevSalesTotal) }}
            </div>
          </div>
          <div class="adb-metric">
            <div class="adb-metric__label">จำนวนคำสั่งซื้อ</div>
            <div class="adb-metric__value">{{ salesCount.toLocaleString() }}</div>
            <div class="adb-metric__compare" :class="compareClass(salesCount, prevSalesCount)">
              {{ compareText(salesCount, prevSalesCount) }}
            </div>
          </div>
          <div class="adb-metric">
            <div class="adb-metric__label">ยอดเฉลี่ยต่อออเดอร์</div>
            <div class="adb-metric__value">฿{{ Math.round(salesAvg).toLocaleString() }}</div>
            <div class="adb-metric__compare" :class="compareClass(salesAvg, prevSalesAvg)">
              {{ compareText(salesAvg, prevSalesAvg) }}
            </div>
          </div>
        </div>

        <div class="adb-chart" :class="{ 'adb-chart--single': chartBuckets.length === 1 }">
          <div v-for="(bucket, i) in chartBuckets" :key="i" class="adb-chart__col">
            <div class="adb-chart__bars">
              <div class="adb-chart__bar adb-chart__bar--prev" :style="{ height: barHeight(bucket.previous) + '%' }" />
              <div class="adb-chart__bar adb-chart__bar--cur" :style="{ height: barHeight(bucket.current) + '%' }" />
            </div>
            <div class="adb-chart__label">{{ bucket.label }}</div>
          </div>
        </div>
        <div class="adb-chart__note">
          <span class="adb-chart__swatch adb-chart__swatch--cur" />ช่วงนี้
          <span class="adb-chart__swatch adb-chart__swatch--prev" />ช่วงก่อนหน้า
        </div>

        <div class="adb-sales__definition">
          “ยอดขาย” นับเฉพาะออเดอร์สถานะ ชำระเงินแล้ว / จัดส่งแล้ว / กำลังจัดส่ง / ส่งถึงแล้ว — ไม่นับออเดอร์ที่ยังไม่ชำระ ชำระไม่สำเร็จ ยกเลิก หรือคืนเงิน
        </div>
      </template>
    </section>

    <!-- ===== Block 3: Backlog ===== -->
    <section class="adb-block">
      <div class="adb-section-title">งานค้างที่ต้องทำ</div>

      <div v-if="shipmentStore.loading" class="adb-card">
        <div class="adb-skel-cards">
          <div v-for="i in 4" :key="i" class="adb-skel-bar" style="width: 100%; height: 76px" />
        </div>
      </div>

      <div v-else-if="shipmentStore.error" class="adb-inline-error adb-card">
        <div class="adb-error-banner">
          <div class="adb-error-banner__icon">!</div>
          <div>
            <div class="adb-error-banner__title">โหลดงานค้างไม่สำเร็จ</div>
            <div class="adb-error-banner__sub">{{ shipmentStore.error }}</div>
          </div>
        </div>
        <button type="button" class="adb-retry-btn" @click="shipmentStore.fetchQueue()">ลองใหม่อีกครั้ง</button>
      </div>

      <div v-else-if="allBacklogClear" class="adb-state-card">
        <div class="adb-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L19 7" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="adb-state-title">เคลียร์งานหมดแล้ว</div>
        <div class="adb-state-sub">ไม่มีงานค้างที่ต้องจัดการตอนนี้</div>
      </div>

      <template v-else>
        <div class="adb-backlog-grid">
          <router-link
            v-for="card in backlogCards"
            :key="card.key"
            :to="card.to"
            class="adb-backlog-card"
            :class="{ 'adb-backlog-card--zero': card.count === 0, 'adb-backlog-card--warn': card.warn && card.count > 0 }"
          >
            <div class="adb-backlog-card__count">{{ card.count }}</div>
            <div class="adb-backlog-card__label">{{ card.label }}</div>
          </router-link>
        </div>

        <div v-if="totalShipments > 0" class="adb-card adb-shipbar">
          <div class="adb-shipbar__track">
            <div class="adb-shipbar__seg adb-shipbar__seg--transit" :style="{ width: shipBarPct.transit + '%' }" />
            <div class="adb-shipbar__seg adb-shipbar__seg--delivered" :style="{ width: shipBarPct.delivered + '%' }" />
            <div class="adb-shipbar__seg adb-shipbar__seg--stuck" :style="{ width: shipBarPct.stuck + '%' }" />
          </div>
          <div class="adb-shipbar__chips">
            <span class="adb-chip"><span class="adb-chip__dot" style="background: #6d28d9" />กำลังขนส่ง {{ shipCounts.transit }}</span>
            <span class="adb-chip"><span class="adb-chip__dot" style="background: #16a34a" />ส่งสำเร็จ {{ shipCounts.delivered }}</span>
            <span class="adb-chip"><span class="adb-chip__dot" style="background: #dc2626" />ติดขัด {{ shipCounts.stuck }}</span>
          </div>
        </div>
      </template>
    </section>

    <!-- ===== Block 4: Products ===== -->
    <section class="adb-block">
      <div class="adb-products-grid">
        <div class="adb-card">
          <div class="adb-section-title">สต็อกใกล้หมด</div>

          <div v-if="productStore.loading" class="adb-skel-cards">
            <div v-for="i in 4" :key="i" class="adb-skel-bar" style="width: 100%; height: 44px" />
          </div>

          <div v-else-if="productStore.error" class="adb-inline-error">
            <div class="adb-error-banner">
              <div class="adb-error-banner__icon">!</div>
              <div>
                <div class="adb-error-banner__title">โหลดสินค้าไม่สำเร็จ</div>
                <div class="adb-error-banner__sub">{{ productStore.error }}</div>
              </div>
            </div>
            <button type="button" class="adb-retry-btn" @click="productStore.getProducts()">ลองใหม่อีกครั้ง</button>
          </div>

          <div v-else-if="lowStockTop5.length === 0" class="adb-empty-note">ไม่มีสินค้าใกล้หมดสต็อก</div>

          <template v-else>
            <table class="adb-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>คงเหลือ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in lowStockTop5" :key="p.id">
                  <td class="adb-td">
                    <div class="adb-product-cell">
                      <img :src="getImageUrl(p.imageUrl)" :alt="p.name" class="adb-product-img" />
                      <span class="adb-product-name">{{ p.name }}</span>
                    </div>
                  </td>
                  <td class="adb-td">{{ p.category?.name ?? '—' }}</td>
                  <td class="adb-td">
                    <span class="adb-stock-badge" :class="p.stock === 0 ? 'adb-stock-badge--out' : 'adb-stock-badge--low'">
                      {{ p.stock === 0 ? 'หมด' : `ใกล้หมด (${p.stock})` }}
                    </span>
                  </td>
                  <td class="adb-td adb-td--action">
                    <router-link :to="{ name: 'adminProducts' }" class="adb-link-btn">จัดการ</router-link>
                  </td>
                </tr>
              </tbody>
            </table>
            <router-link v-if="lowStockAll.length > 5" :to="{ name: 'adminProducts' }" class="adb-view-all">
              ดูทั้งหมด ({{ lowStockAll.length }})
            </router-link>
          </template>
        </div>

        <div class="adb-card">
          <div class="adb-section-title">สินค้าขายดี</div>

          <div v-if="shipmentStore.loading" class="adb-skel-cards">
            <div v-for="i in 4" :key="i" class="adb-skel-bar" style="width: 100%; height: 44px" />
          </div>

          <div v-else-if="shipmentStore.error" class="adb-inline-error">
            <div class="adb-error-banner">
              <div class="adb-error-banner__icon">!</div>
              <div>
                <div class="adb-error-banner__title">โหลดสินค้าขายดีไม่สำเร็จ</div>
                <div class="adb-error-banner__sub">{{ shipmentStore.error }}</div>
              </div>
            </div>
            <button type="button" class="adb-retry-btn" @click="shipmentStore.fetchQueue()">ลองใหม่อีกครั้ง</button>
          </div>

          <div v-else-if="bestSellers.length === 0" class="adb-empty-note">ยังไม่มีข้อมูลยอดขายสินค้า</div>

          <table v-else class="adb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>สินค้า</th>
                <th>ขายได้</th>
                <th>ยอดเงิน</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in bestSellers" :key="item.productId">
                <td class="adb-td adb-td--rank">{{ i + 1 }}</td>
                <td class="adb-td">
                  <div class="adb-product-cell">
                    <img :src="getImageUrl(item.imageUrl)" :alt="item.name" class="adb-product-img" />
                    <span class="adb-product-name">{{ item.name }}</span>
                  </div>
                </td>
                <td class="adb-td">{{ item.quantity }}</td>
                <td class="adb-td adb-td--amount">฿{{ item.revenue.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAdminOrderStore } from 'src/stores/adminOrderStore';
import { useAdminShipmentStore } from 'src/stores/adminShipmentStore';
import type { AdminOrderData } from 'src/stores/adminShipmentStore';
import { useProductStore } from 'src/stores/productStore';
import { getImageUrl } from 'src/utils/imageUrl';

const orderStore = useAdminOrderStore();
const shipmentStore = useAdminShipmentStore();
const productStore = useProductStore();

onMounted(() => {
  void orderStore.fetchAll();
  void shipmentStore.fetchQueue();
  void productStore.getProducts();
});

// ---- Sales summary (block 2) ----

const SALES_STATUSES = new Set(['paid', 'shipped', 'shipping', 'delivered']);

type RangeKey = 'today' | '7d' | '30d';
const RANGE_OPTIONS: { key: RangeKey; label: string; days: number; compareLabel: string }[] = [
  { key: 'today', label: 'วันนี้', days: 1, compareLabel: 'เมื่อวาน' },
  { key: '7d', label: '7 วัน', days: 7, compareLabel: '7 วันก่อนหน้า' },
  { key: '30d', label: '30 วัน', days: 30, compareLabel: '30 วันก่อนหน้า' },
];
const activeRange = ref<RangeKey>('7d');
const activeRangeOption = computed(() => RANGE_OPTIONS.find((r) => r.key === activeRange.value)!);

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sumSalesInRange(start: Date, end: Date): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (const o of orderStore.orders) {
    if (!SALES_STATUSES.has(o.status)) continue;
    const created = new Date(o.createdAt);
    if (created >= start && created < end) {
      total += Number(o.total);
      count += 1;
    }
  }
  return { total, count };
}

const currentWindow = computed(() => {
  const days = activeRangeOption.value.days;
  const end = new Date();
  const start = new Date(startOfDay(end).getTime() - (days - 1) * 86_400_000);
  return { start, end };
});

const previousWindow = computed(() => {
  const days = activeRangeOption.value.days;
  const { start } = currentWindow.value;
  return { start: new Date(start.getTime() - days * 86_400_000), end: start };
});

const salesTotal = computed(() => sumSalesInRange(currentWindow.value.start, currentWindow.value.end).total);
const salesCount = computed(() => sumSalesInRange(currentWindow.value.start, currentWindow.value.end).count);
const salesAvg = computed(() => (salesCount.value > 0 ? salesTotal.value / salesCount.value : 0));

const prevSalesTotal = computed(() => sumSalesInRange(previousWindow.value.start, previousWindow.value.end).total);
const prevSalesCount = computed(() => sumSalesInRange(previousWindow.value.start, previousWindow.value.end).count);
const prevSalesAvg = computed(() => (prevSalesCount.value > 0 ? prevSalesTotal.value / prevSalesCount.value : 0));

function compareText(cur: number, prev: number): string {
  const label = activeRangeOption.value.compareLabel;
  if (prev === 0) return cur === 0 ? `เท่ากับ${label}` : `${label}ยังไม่มีข้อมูลเทียบ`;
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return `เท่ากับ${label}`;
  return pct > 0 ? `มากกว่า${label} ${pct}%` : `น้อยกว่า${label} ${Math.abs(pct)}%`;
}

function compareClass(cur: number, prev: number): string {
  if (prev === 0 || cur === prev) return 'adb-metric__compare--flat';
  return cur > prev ? 'adb-metric__compare--up' : 'adb-metric__compare--down';
}

const chartBuckets = computed(() => {
  const days = activeRangeOption.value.days;
  const buckets: { label: string; current: number; previous: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(startOfDay(new Date()).getTime() - i * 86_400_000);
    const end = new Date(start.getTime() + 86_400_000);
    const prevStart = new Date(start.getTime() - days * 86_400_000);
    const prevEnd = new Date(end.getTime() - days * 86_400_000);
    buckets.push({
      label: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      current: sumSalesInRange(start, end).total,
      previous: sumSalesInRange(prevStart, prevEnd).total,
    });
  }
  return buckets;
});

const chartMax = computed(() => Math.max(1, ...chartBuckets.value.flatMap((b) => [b.current, b.previous])));

function barHeight(value: number): number {
  if (value <= 0) return 3;
  return Math.max((value / chartMax.value) * 100, 4);
}

// ---- Backlog (block 3) ----

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function isStuck(order: AdminOrderData): boolean {
  return order.shipments.some((s) => s.status === 'failed' || s.status === 'returned');
}

const readyToShip = computed(() => shipmentStore.orders.filter((o) => o.status === 'paid'));
const readyToShipOverdue = computed(() => readyToShip.value.filter((o) => daysSince(o.createdAt) >= 2));
const stuckOrders = computed(() => shipmentStore.orders.filter(isStuck));
const pendingPaymentOrders = computed(() => orderStore.orders.filter((o) => o.status === 'pending'));

const allBacklogClear = computed(
  () =>
    readyToShip.value.length === 0 &&
    stuckOrders.value.length === 0 &&
    pendingPaymentOrders.value.length === 0,
);

const backlogCards = computed(() => [
  {
    key: 'ready',
    label: 'ต้องจัดส่ง',
    count: readyToShip.value.length,
    warn: false,
    to: { name: 'adminShipments', query: { tab: 'preparing' } },
  },
  {
    key: 'overdue',
    label: 'ค้างเกิน 2 วัน',
    count: readyToShipOverdue.value.length,
    warn: true,
    to: { name: 'adminShipments', query: { tab: 'preparing' } },
  },
  {
    key: 'stuck',
    label: 'พัสดุติดขัด',
    count: stuckOrders.value.length,
    warn: true,
    to: { name: 'adminShipments', query: { tab: 'stuck' } },
  },
  {
    key: 'pending',
    label: 'รอชำระเงิน',
    count: pendingPaymentOrders.value.length,
    warn: false,
    to: { name: 'adminOrders', query: { group: 'pending' } },
  },
]);

const allShipments = computed(() => shipmentStore.orders.flatMap((o) => o.shipments));
const totalShipments = computed(() => allShipments.value.length);
const shipCounts = computed(() => {
  let transit = 0;
  let delivered = 0;
  let stuck = 0;
  for (const s of allShipments.value) {
    if (s.status === 'delivered') delivered++;
    else if (s.status === 'failed' || s.status === 'returned') stuck++;
    else transit++;
  }
  return { transit, delivered, stuck };
});
const shipBarPct = computed(() => {
  const total = totalShipments.value || 1;
  return {
    transit: (shipCounts.value.transit / total) * 100,
    delivered: (shipCounts.value.delivered / total) * 100,
    stuck: (shipCounts.value.stuck / total) * 100,
  };
});

// ---- Products (block 4) ----

const lowStockAll = computed(() =>
  [...productStore.products].filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock),
);
const lowStockTop5 = computed(() => lowStockAll.value.slice(0, 5));

interface BestSellerRow {
  productId: number;
  name: string;
  imageUrl: string;
  quantity: number;
  revenue: number;
}

const bestSellers = computed(() => {
  const map = new Map<number, BestSellerRow>();
  for (const order of shipmentStore.orders) {
    for (const item of order.orderItems) {
      const existing = map.get(item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += Number(item.lineTotal);
      } else {
        map.set(item.product.id, {
          productId: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          quantity: item.quantity,
          revenue: Number(item.lineTotal),
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
});
</script>

<style scoped>
.adb-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.adb-header {
  margin-bottom: 18px;
}

.adb-header__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.adb-header__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.adb-block {
  margin-top: 28px;
}

.adb-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 14px;
}

.adb-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

/* Sales block */

.adb-sales__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.adb-sales__head .adb-section-title {
  margin-bottom: 0;
}

.adb-sales__scope-note {
  font-size: 11.5px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.adb-range-tabs {
  display: flex;
  gap: 6px;
}

.adb-range-tab {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.adb-range-tab--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
}

.adb-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.adb-metric__label {
  font-size: 12.5px;
  color: #6b7280;
}

.adb-metric__value {
  font-size: 22px;
  font-weight: 600;
  color: #1d1d1d;
  margin-top: 4px;
}

.adb-metric__value--brand {
  color: #6d28d9;
}

.adb-metric__compare {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
}

.adb-metric__compare--up {
  color: #16a34a;
}

.adb-metric__compare--down {
  color: #dc2626;
}

.adb-metric__compare--flat {
  color: #9ca3af;
  font-weight: 500;
}

.adb-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
  padding: 0 4px;
}

.adb-chart--single {
  justify-content: center;
}

.adb-chart--single .adb-chart__col {
  max-width: 80px;
}

.adb-chart__col {
  flex: 1;
  min-width: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.adb-chart__bars {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
}

.adb-chart__bar {
  width: 40%;
  border-radius: 3px 3px 0 0;
  min-height: 3px;
}

.adb-chart__bar--cur {
  background: #6d28d9;
}

.adb-chart__bar--prev {
  background: #e5e7eb;
}

.adb-chart__label {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 6px;
  white-space: nowrap;
}

.adb-chart__note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 10px;
}

.adb-chart__swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  display: inline-block;
  margin-left: 8px;
}

.adb-chart__swatch:first-child {
  margin-left: 0;
}

.adb-chart__swatch--cur {
  background: #6d28d9;
}

.adb-chart__swatch--prev {
  background: #e5e7eb;
}

.adb-sales__definition {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
  line-height: 1.6;
}

/* Backlog */

.adb-backlog-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

.adb-backlog-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-decoration: none;
  display: block;
}

.adb-backlog-card__count {
  font-size: 26px;
  font-weight: 700;
  color: #6d28d9;
}

.adb-backlog-card__label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.adb-backlog-card--zero {
  opacity: 0.5;
}

.adb-backlog-card--zero .adb-backlog-card__count {
  color: #9ca3af;
}

.adb-backlog-card--warn:not(.adb-backlog-card--zero) {
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.adb-backlog-card--warn:not(.adb-backlog-card--zero) .adb-backlog-card__count {
  color: #c2410c;
}

.adb-shipbar__track {
  display: flex;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #f3f4f6;
  margin-bottom: 12px;
}

.adb-shipbar__seg--transit {
  background: #6d28d9;
}

.adb-shipbar__seg--delivered {
  background: #16a34a;
}

.adb-shipbar__seg--stuck {
  background: #dc2626;
}

.adb-shipbar__chips {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.adb-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #6b7280;
}

.adb-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Products */

.adb-products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.adb-table {
  width: 100%;
  border-collapse: collapse;
}

.adb-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  padding: 0 8px 10px;
}

.adb-td {
  padding: 10px 8px;
  border-top: 1px solid #f3f4f6;
  font-size: 13px;
  color: #1d1d1d;
  vertical-align: middle;
}

.adb-td--rank {
  font-weight: 600;
  color: #9ca3af;
  width: 20px;
}

.adb-td--amount {
  font-weight: 600;
  color: #6d28d9;
  white-space: nowrap;
}

.adb-td--action {
  text-align: right;
}

.adb-product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.adb-product-img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f3f4f6;
}

.adb-product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adb-stock-badge {
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.adb-stock-badge--out {
  color: #dc2626;
  background: #fef2f2;
}

.adb-stock-badge--low {
  color: #c2410c;
  background: #fff7ed;
}

.adb-link-btn {
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  text-decoration: none;
  white-space: nowrap;
}

.adb-view-all {
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6d28d9;
  text-decoration: none;
}

.adb-empty-note {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
}

/* Shared: skeleton, error, empty state */

.adb-skel-bar {
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: adb-shimmer 1.4s ease infinite;
}

@keyframes adb-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.adb-skel-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.adb-skel-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.adb-inline-error {
  text-align: center;
}

.adb-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 14px;
  text-align: left;
}

.adb-error-banner__icon {
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

.adb-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.adb-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.adb-retry-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
  border-radius: 14px;
  cursor: pointer;
}

.adb-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 32px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
}

.adb-state-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.adb-state-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 4px;
}

.adb-state-sub {
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 860px) {
  .adb-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .adb-metrics {
    grid-template-columns: 1fr;
  }

  .adb-backlog-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .adb-skel-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .adb-products-grid {
    grid-template-columns: 1fr;
  }

  .adb-table {
    min-width: 480px;
    display: block;
    overflow-x: auto;
  }

  .adb-sales__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
