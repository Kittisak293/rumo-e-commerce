<template>
  <q-layout view="hHh Lpr fFf" class="bg-grey-1">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="q-px-lg q-py-xss">
        <div class="row items-center full-width no-wrap">
          <div class="row items-center cursor-pointer" @click="onLogoClick">
            <img :src="RumoLogo" alt="RUMO" style="width: 200px" />
          </div>

          <div class="search-wrapper">
            <div class="search-pill">
              <q-input
                v-model="search"
                borderless
                dense
                placeholder="ค้นหาสินค้า"
                class="search-input2"
                input-class="search-input-inner"
                @keyup.enter="onSearch"
              />

              <q-btn label="ค้นหา" class="search-btn2" unelevated no-caps @click="onSearch" />
            </div>
          </div>
          <q-space />

          <div class="row items-center q-gutter-md">
            <button class="icon-click" @click="navigateTo('notifications')">
              <img :src="bellLogo" alt="BELL" style="width: 35px" />
            </button>

            <button class="icon-click cart-icon" @click="navigateTo('checkout')">
              <img :src="cartLogo" alt="CART" style="width: 35px" />
              <span v-if="cart.count > 0" class="cart-badge">{{ cart.count > 99 ? '99+' : cart.count }}</span>
            </button>

            <button class="icon-click" @click="onAccountClick">
              <img :src="peopleLogo" alt="PEOPLE" style="width: 30px" />
              <q-menu v-if="auth.isAuthenticated && auth.user?.role !== 'admin'" anchor="bottom right" self="top right">
                <q-list style="min-width: 160px">
                  <q-item class="text-grey-8">
                    <q-item-section>{{ auth.user?.name }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="logoutDialogOpen = true">
                    <q-item-section>ออกจากระบบ</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
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
      :width="220"
      class="bg-grey-4 app-drawer"
      bordered
    >
      <q-list class="q-pt-md q-px-sm">
        <q-item
          clickable
          @click="navigateTo('home')"
          :active="$route.name === 'home'"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <svg class="drawer-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 10.5L12 3l9 7.5" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </q-item-section>
          <q-item-section class="drawer-text">หน้าหลัก</q-item-section>
        </q-item>

        <q-item
          clickable
          @click="navigateTo('mall')"
          :active="$route.name === 'mall'"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <svg class="drawer-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9V7a6 6 0 1 1 12 0v2" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" />
              <rect x="3" y="9" width="18" height="12" rx="2" stroke="#8e4dff" stroke-width="1.8" />
              <path d="M9 12a3 3 0 0 0 6 0" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </q-item-section>
          <q-item-section class="drawer-text">Mall</q-item-section>
        </q-item>

        <q-item
          clickable
          @click="navigateTo('coupon')"
          :active="$route.name === 'coupon'"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <svg class="drawer-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V8z" stroke="#8e4dff" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M9 6v12" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 2.5" />
            </svg>
          </q-item-section>
          <q-item-section class="drawer-text">เก็บโค้ด</q-item-section>
        </q-item>

        <q-item
          v-if="auth.isAuthenticated"
          clickable
          @click="navigateTo('orders')"
          :active="ordersActive"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <svg class="drawer-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="#8e4dff" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M9 8h6M9 12h6M9 16h3" stroke="#8e4dff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </q-item-section>
          <q-item-section class="drawer-text drawer-text--sm">คำสั่งซื้อของฉัน</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view :key="$route.fullPath" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import RumoLogo from 'src/assets/logos/Rumo.png';

import bellLogo from 'src/assets/icons/bell.png';
import cartLogo from 'src/assets/icons/cart.png';
import peopleLogo from 'src/assets/icons/people.png';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { useCartStore } from 'src/stores/cartStore';

const leftOpen = ref(true); // ให้ drawer โชว์บน desktop
const ordersActive = computed(
  () => typeof route.name === 'string' && ['orders', 'orderDetail', 'orderTracking'].includes(route.name),
);
const search = ref('');
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();

onMounted(() => {
  if (auth.isAuthenticated) void cart.fetchCount();
});

watch(
  () => auth.isAuthenticated,
  (loggedIn) => {
    if (loggedIn) void cart.fetchCount();
    else cart.reset();
  },
);

const onLogoClick = () => {
  if (auth.isAuthenticated && auth.user?.role === 'admin') {
    void navigateTo('account');
  } else {
    void navigateTo('home');
  }
};

const onAccountClick = () => {
  if (!auth.isAuthenticated) {
    void router.push({ name: 'login' });
  } else if (auth.user?.role === 'admin') {
    void router.push({ name: 'account' });
  }
  // when authenticated non-admin, the q-menu anchored to this button opens on click
};

const logoutDialogOpen = ref(false);

const confirmLogout = () => {
  logoutDialogOpen.value = false;
  auth.logout();
  cart.reset();
  void router.push({ name: 'login' });
};

const onSearch = async () => {
  const q = search.value.trim();
  if (!q) return;
  await router.push({ name: 'search', query: { q } });
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
.search-area {
  max-width: 640px;
  width: 100%;
}

.search-input :deep(.q-field__control) {
  border-radius: 999px;
}

.search-btn {
  min-width: 80px;
  border-radius: 999px;
}

.app-drawer {
  padding-top: 64px; /* ให้รู้สึกต่อจาก header */
}

.drawer-item {
  border-radius: 18px;
  box-shadow: 0 5px 4px rgba(0, 0, 0, 0.25);
}

.full-width {
  background: #6d28d9;
  color: white;
}

.no-wrap {
  background: #6d28d9;
  color: white;
}

.my-toolbar {
  background-color: #d4d4d4;
  color: white;
}

.menu-item {
  background-color: white;
  color: #8e4dff;
}

.drawer-text {
  font-size: 14px;
  font-weight: 501;
  color: #8e4dff;
}

.drawer-text--sm {
  font-size: 14px;
}

.search-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

.search-pill {
  width: 100%;
  max-width: 650px;
  background: #ffffff;
  border-radius: 999px;
  display: flex;
  align-items: center;
  padding-left: 18px;
  padding-right: 4px;
}

.search-input2 :deep(.q-field__control) {
  background: white;
  box-shadow: none !important;
}

.search-input2 {
  flex: 1;
}

.search-btn2 {
  border-radius: 999px;
  padding: 0 20px;
  font-weight: 600;
  background-color: #8e4dff;
  box-shadow: 0 5px 4px rgba(0, 0, 0, 0.25);
}

.search-input-inner::placeholder {
  color: #9ca3af;
}

.icon-click {
  background: none; /* ไม่มีพื้นหลัง */
  border: none; /* ไม่มีขอบ */
  padding: 0; /* ไม่ดันรูปให้เพี้ยน */
  cursor: pointer; /* แสดงเป็นปุ่มเมื่อ hover */
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0px 5px 4px rgba(0, 0, 0, 0.25));
  margin-right: 20px;
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  filter: none;
}

/* รูปมีเงาตาม PNG */
.icon-click img {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25)); /* เงาตามขอบรูป */
  transition: 0.01s ease;
}

/* effect ตอนกด */
.icon-click:active img {
  transform: scale(0.92); /* ยุบตอนกดเหมือนปุ่มมือถือ */
}

.menu-item:active {
  transform: scale(0.92);
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

.drawer-item--active .drawer-svg-icon path,
.drawer-item--active .drawer-svg-icon rect {
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
