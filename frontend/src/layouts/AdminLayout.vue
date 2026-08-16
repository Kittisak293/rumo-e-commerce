<template>
  <q-layout view="hHh Lpr fFf" class="bg-grey-1">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="q-px-lg q-py-xss">
        <div class="row items-center full-width no-wrap">
          <div class="row items-center cursor-pointer" @click="navigateTo('account')">
            <img :src="RumoLogo" alt="RUMO" style="width: 200px" />
          </div>

          <div class="admin-header-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#fff" opacity="0.25"/>
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#fff" stroke-width="1.5" fill="none"/>
              <path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Admin Panel</span>
          </div>

          <q-space />

          <div class="row items-center q-gutter-md">
            <!-- Admin profile section -->
            <div class="admin-profile">
              <div class="admin-avatar">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#fff" stroke-width="1.8"/>
                  <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="admin-profile-info">
                <div class="admin-profile-name">{{ auth.user?.name ?? 'Admin' }}</div>
                <div class="admin-profile-role">ผู้ดูแลระบบ</div>
              </div>
            </div>
            <button class="icon-click" @click="logoutDialogOpen = true" title="ออกจากระบบ">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-dialog v-model="logoutDialogOpen">
      <div class="app-delete-modal">
        <div class="app-logout-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" stroke="#6d28d9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="app-delete-title">ออกจากระบบ?</div>
        <div class="app-delete-desc">คุณต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งานต่อ</div>
        <div class="app-delete-actions">
          <button type="button" class="app-btn-secondary" style="flex: 1" @click="logoutDialogOpen = false">
            ยกเลิก
          </button>
          <button type="button" class="app-btn-logout" style="flex: 1" @click="confirmLogout">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </q-dialog>

    <q-drawer
      v-model="leftOpen"
      side="left"
      show-if-above
      :width="250"
      class="bg-grey-4 app-drawer"
      bordered
    >

      <q-separator class="admin-separator" />

      <q-list class="q-pt-sm q-px-sm " >
        <q-item
          v-for="item in menuItems"
          :key="item.route"
          clickable
          @click="navigateTo(item.route)"
          :active="isActive(item)"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <div class="admin-icon" v-html="item.icon"></div>
          </q-item-section>
          <q-item-section class="admin-text">{{ item.label }}</q-item-section>
        </q-item>
      </q-list>

      <div class="admin-drawer-footer">
        <div class="admin-version">RUMO Admin v1.0</div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view :key="$route.fullPath" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RumoLogo from 'src/assets/logos/Rumo.png';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { useCartStore } from 'src/stores/cartStore';

const leftOpen = ref(true);
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  /** extra route names that should highlight this menu item */
  activeRoutes?: string[];
}

const menuItems: MenuItem[] = [
  {
    label: 'ภาพรวมแอดมิน',
    route: 'account',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 21h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="5" y="13" width="4" height="8" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="3" width="4" height="18" rx="1" stroke="currentColor" stroke-width="1.8"/></svg>',
  },
  {
    label: 'จัดการพัสดุ',
    route: 'adminShipments',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5v-9z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 5.25l9 4.5v3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    label: 'จัดการคำสั่งซื้อ',
    route: 'adminOrders',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.8"/><path d="M9 14l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    label: 'จัดการสินค้า',
    route: 'adminProducts',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>',
  },
  {
    label: 'จัดการหมวดหมู่',
    route: 'adminCategories',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="17" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
  },
  {
    label: 'จัดการบริษัทขนส่ง',
    route: 'adminCarriers',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke="currentColor" stroke-width="1.8"/><path d="M16 8h4l3 4v5h-7V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8"/></svg>',
  },
  {
    label: 'จัดการผู้ใช้',
    route: 'adminUsers',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
];

function isActive(item: MenuItem): boolean {
  const name = route.name as string;
  if (name === item.route) return true;
  return item.activeRoutes?.includes(name) ?? false;
}

const logoutDialogOpen = ref(false);

const confirmLogout = () => {
  logoutDialogOpen.value = false;
  auth.logout();
  cart.reset();
  void router.push({ name: 'login' });
};

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
.admin-drawer {
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%);
  padding-top: 64px;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
}

.admin-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.admin-profile-info {
  min-width: 0;
}

.admin-profile-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-profile-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.admin-separator {
  background: rgba(255, 255, 255, 0.1);
  margin: 0 16px;
}

.admin-item {
  border-radius: 12px;
  min-height: 44px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.admin-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.admin-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.admin-text {
  font-size: 14px;
  font-weight: 500;
}

.admin-item--active {
  background: rgba(139, 92, 246, 0.35) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.admin-item--active .admin-icon {
  color: #c4b5fd;
}

.admin-drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  text-align: center;
}

.admin-version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* Header styles — shared with MainLayout */
.full-width {
  background: #6d28d9;
  color: white;
}

.no-wrap {
  background: #6d28d9;
  color: white;
}

.admin-header-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  padding: 4px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.3px;
}

.icon-click {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0px 5px 4px rgba(0, 0, 0, 0.25));
  margin-right: 20px;
  position: relative;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.icon-click:hover {
  opacity: 1;
}

.icon-click:active svg {
  transform: scale(0.92);
}

.drawer-item--active .drawer-text {
  color: white !important;
}

.drawer-text {
  font-size: 20px;
  font-weight: 501;
  color: #8e4dff;
}

.menu-item:active {
  transform: scale(0.92);
}

.menu-item {
  background-color: white;
  color: #8e4dff;
}

.drawer-item {
  border-radius: 18px;
  box-shadow: 0 5px 4px rgba(0, 0, 0, 0.25);
}

.drawer-item--active {
  background-color: #8e4dff !important;
  color: white !important;
  border-radius: 18px;
  box-shadow: inset 0 5px 10px rgba(0, 0, 0, 0.25);
}

.drawer-item--active .drawer-text {
  color: white !important;
}

.drawer-item--active img {
  filter: brightness(0) invert(1); /* ไอคอนเป็นสีขาว */
}

.drawer-item--active .drawer-svg-icon path {
  stroke: white;
}

/* Logout confirmation modal */
.app-delete-modal {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  padding: 28px 24px;
  text-align: center;
}

.app-logout-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f3e8ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.app-delete-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 8px;
  word-break: break-word;
}

.app-delete-desc {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 20px;
}

.app-delete-actions {
  display: flex;
  gap: 10px;
}

.app-btn-secondary {
  font-family: inherit;
  box-sizing: border-box;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.app-btn-logout {
  font-family: inherit;
  box-sizing: border-box;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  color: #fff;
  background: #6d28d9;
  border: none;
}

.app-btn-logout:hover {
  background: #5b21b6;
}
</style>
