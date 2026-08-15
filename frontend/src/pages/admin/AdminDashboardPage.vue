<template>
  <q-page class="adm-dash">
    <div class="adm-dash__header">
      <div>
        <h1 class="adm-dash__title">ภาพรวมแอดมิน</h1>
        <p class="adm-dash__sub">ยินดีต้อนรับ, {{ auth.user?.name ?? 'Admin' }} 👋</p>
      </div>
      <div class="adm-dash__date">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6d28d9" stroke-width="1.8"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="#6d28d9" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span>{{ todayFormatted }}</span>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="adm-stats">
      <div v-for="stat in stats" :key="stat.label" class="adm-stat-card" :style="{ '--accent': stat.color }">
        <div class="adm-stat-icon" v-html="stat.icon"></div>
        <div class="adm-stat-info">
          <div class="adm-stat-value">{{ stat.value }}</div>
          <div class="adm-stat-label">{{ stat.label }}</div>
        </div>
        <div class="adm-stat-trend" :class="stat.trendUp ? 'up' : 'down'">
          <svg v-if="stat.trendUp" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17l5-5 5 5M7 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 7l-5 5-5-5M17 17H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ stat.trend }}
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="adm-section">
      <h2 class="adm-section__title">เมนูด่วน</h2>
      <div class="adm-quick-links">
        <button
          v-for="link in quickLinks"
          :key="link.route"
          class="adm-quick-card"
          @click="navigateTo(link.route)"
        >
          <div class="adm-quick-icon" v-html="link.icon" :style="{ background: link.bg }"></div>
          <div class="adm-quick-label">{{ link.label }}</div>
          <div class="adm-quick-desc">{{ link.desc }}</div>
        </button>
      </div>
    </div>

    <!-- Recent Activity Placeholder -->
    <div class="adm-section">
      <h2 class="adm-section__title">กิจกรรมล่าสุด</h2>
      <div class="adm-activity-card">
        <div v-for="(activity, i) in recentActivities" :key="i" class="adm-activity-row">
          <div class="adm-activity-dot" :style="{ background: activity.color }"></div>
          <div class="adm-activity-text">{{ activity.text }}</div>
          <div class="adm-activity-time">{{ activity.time }}</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const todayFormatted = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

const stats = [
  {
    label: 'คำสั่งซื้อวันนี้',
    value: '24',
    trend: '+12%',
    trendUp: true,
    color: '#8b5cf6',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#8b5cf6" stroke-width="1.8"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="#8b5cf6" stroke-width="1.8"/></svg>',
  },
  {
    label: 'รายได้วันนี้',
    value: '฿18,450',
    trend: '+8%',
    trendUp: true,
    color: '#10b981',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#10b981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    label: 'สินค้าทั้งหมด',
    value: '156',
    trend: '+3',
    trendUp: true,
    color: '#f59e0b',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#f59e0b" stroke-width="1.8"/><circle cx="7" cy="7" r="1.5" fill="#f59e0b"/></svg>',
  },
  {
    label: 'ผู้ใช้ทั้งหมด',
    value: '1,247',
    trend: '+5%',
    trendUp: true,
    color: '#3b82f6',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="#3b82f6" stroke-width="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
];

const quickLinks = [
  {
    label: 'จัดการพัสดุ',
    desc: 'ดูคิวงานจัดส่ง',
    route: 'adminShipments',
    bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke="#fff" stroke-width="1.8"/><path d="M16 8h4l3 4v5h-7V8z" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="#fff" stroke-width="1.8"/><circle cx="18.5" cy="18.5" r="2.5" stroke="#fff" stroke-width="1.8"/></svg>',
  },
  {
    label: 'จัดการคำสั่งซื้อ',
    desc: 'ดูรายการสั่งซื้อ',
    route: 'adminOrders',
    bg: 'linear-gradient(135deg, #10b981, #059669)',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#fff" stroke-width="1.8"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="#fff" stroke-width="1.8"/><path d="M9 14l2 2 4-4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    label: 'จัดการสินค้า',
    desc: 'เพิ่ม/แก้ไขสินค้า',
    route: 'adminProducts',
    bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#fff" stroke-width="1.8"/><circle cx="7" cy="7" r="1.5" fill="#fff"/></svg>',
  },
  {
    label: 'จัดการผู้ใช้',
    desc: 'จัดการสมาชิก',
    route: 'adminUsers',
    bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="#fff" stroke-width="1.8"/></svg>',
  },
];

const recentActivities = [
  { text: 'คำสั่งซื้อ #10042 ชำระเงินแล้ว', time: '5 นาทีที่แล้ว', color: '#10b981' },
  { text: 'สินค้า "เสื้อยืด Premium" เพิ่มใหม่', time: '15 นาทีที่แล้ว', color: '#8b5cf6' },
  { text: 'พัสดุ #SH-2041 จัดส่งแล้ว', time: '32 นาทีที่แล้ว', color: '#3b82f6' },
  { text: 'ผู้ใช้ใหม่ลงทะเบียน: somchai@email.com', time: '1 ชั่วโมงที่แล้ว', color: '#f59e0b' },
  { text: 'คำสั่งซื้อ #10039 ถูกยกเลิก', time: '2 ชั่วโมงที่แล้ว', color: '#ef4444' },
];

const navigateTo = async (routeName: string) => {
  if (route.name === routeName) {
    await router.replace({ name: routeName, query: { refresh: Date.now() } });
    await router.replace({ name: routeName });
  } else {
    await router.push({ name: routeName });
  }
};
</script>

<style scoped>
.adm-dash {
  padding: 28px 32px;
  max-width: 1200px;
}

.adm-dash__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.adm-dash__title {
  font-size: 26px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0;
}

.adm-dash__sub {
  font-size: 15px;
  color: #6b7280;
  margin: 4px 0 0;
}

.adm-dash__date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6d28d9;
  background: #f5f3ff;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* Stat Cards */
.adm-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.adm-stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  border: 1px solid #f3f4f6;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.adm-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--accent);
  border-radius: 4px 0 0 4px;
}

.adm-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.adm-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.adm-stat-info {
  flex: 1;
  min-width: 0;
}

.adm-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.adm-stat-label {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

.adm-stat-trend {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-radius: 8px;
}

.adm-stat-trend.up {
  color: #059669;
  background: #ecfdf5;
}

.adm-stat-trend.down {
  color: #dc2626;
  background: #fef2f2;
}

/* Section */
.adm-section {
  margin-bottom: 32px;
}

.adm-section__title {
  font-size: 18px;
  font-weight: 600;
  color: #1e1b4b;
  margin: 0 0 16px;
}

/* Quick Links */
.adm-quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.adm-quick-card {
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 20px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.adm-quick-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #e5e7eb;
}

.adm-quick-card:active {
  transform: scale(0.98);
}

.adm-quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.adm-quick-label {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.adm-quick-desc {
  font-size: 13px;
  color: #9ca3af;
}

/* Activity */
.adm-activity-card {
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 8px 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.adm-activity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  transition: background 0.15s;
}

.adm-activity-row:hover {
  background: #f9fafb;
}

.adm-activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.adm-activity-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.adm-activity-time {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}
</style>
