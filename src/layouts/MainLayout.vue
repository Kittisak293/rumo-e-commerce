<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="hHh Lpr fFf" class="bg-grey-1">
    <!-- HEADER -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="q-px-lg q-py-sm">
        <div class="row items-center full-width no-wrap">
          <!-- โลโก้ -->
          <div class="row items-center">
            <img :src="RumoLogo" alt="RUMO" style="width: 200px" />
          </div>

          <!-- กล่อง search + ปุ่มค้นหา -->
          <div class="search-wrapper">
            <div class="search-pill">
              <q-input
                v-model="search"
                borderless
                dense
                placeholder="ค้นหาสินค้า"
                class="search-input2"
                input-class="search-input-inner"
              />

              <q-btn label="ค้นหา" class="search-btn2" unelevated no-caps />
            </div>
          </div>

          <!-- ช่องว่างก่อน icon ขวา -->
          <q-space />

          <!-- ไอคอน notification / cart / profile -->
          <div class="row items-center q-gutter-md">
            <img :src="bellLogo" alt="BELL" style="width: 35px" />
            <div></div>
            <img :src="cartLogo" alt="CART" style="width: 35px" />
            <div></div>
            <img :src="peopleLogo" alt="PEOPLE" style="width: 30px" />
          </div>
        </div>
      </q-toolbar>

      <!-- เส้นสีม่วงด้านล่าง header -->
      <div class="header-bar-bottom" />
    </q-header>

    <!-- DRAWER ซ้าย -->
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
          v-ripple
          clickable
          :to="{ name: 'home' }"
          :active="$route.name === 'home'"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <img :src="homePurpleLogo" alt="HOME" style="width: 30px" />
          </q-item-section>
          <q-item-section class="drawer-text">หน้าหลัก</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="{ name: 'mall' }"
          :active="$route.name === 'mall'"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <img :src="mallPurpleLogo" alt="HOME" style="width: 30px" />
          </q-item-section>
          <q-item-section class="drawer-text">Mall</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="{ name: 'coupons' }"
          :active="$route.name === 'coupons'"
          active-class="drawer-item--active"
          class="drawer-item q-mb-sm menu-item"
        >
          <q-item-section avatar>
            <img :src="couponPurpleLogo" alt="HOME" style="width: 30px" />
          </q-item-section>
          <q-item-section class="drawer-text">เก็บโค้ด</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- CONTENT -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RumoLogo from 'src/assets/Rumo.png';
import homeLogo from 'src/assets/home.png';
import homePurpleLogo from 'src/assets/home_purple.png';
import mallLogo from 'src/assets/mall.png';
import mallPurpleLogo from 'src/assets/mall_purple.png';
import couponLogo from 'src/assets/coupon2.png';
import couponPurpleLogo from 'src/assets/coupon2_purple.png';
import bellLogo from 'src/assets/bell.png';
import cartLogo from 'src/assets/cart.png';
import peopleLogo from 'src/assets/people.png';

const leftOpen = ref(true); // ให้ drawer โชว์บน desktop
const search = ref('');
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

.header-bar-bottom {
  height: 4px;
  background: white;
  opacity: 0.1;
}

/* Drawer */
.app-drawer {
  padding-top: 64px; /* ให้รู้สึกต่อจาก header */
}

.drawer-item {
  border-radius: 18px;
  box-shadow: 0 5px 5px rgba(15, 23, 42, 0.08);
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
  font-size: 20px;
  font-weight: 501;
  color: #8e4dff;
}

.search-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

.search-pill {
  width: 100%;
  max-width: 650px;
  background: #ffffff; /* ทั้งแท่งเป็นสีขาว */
  border-radius: 999px;
  display: flex;
  align-items: center;
  padding-left: 18px;
  padding-right: 4px;
}

/* q-input ให้พื้นหลังโปร่งใส ไม่ดึงสีม่วงมา */
.search-input2 :deep(.q-field__control) {
  background: white;
  box-shadow: none !important;
}

.search-input2 {
  flex: 1;
}

/* ปุ่มค้นหาเป็นแคปซูลม่วง */
.search-btn2 {
  border-radius: 999px;
  padding: 0 20px;
  font-weight: 600;
  background-color: #8e4dff;
}

/* placeholder สีเทาอ่อน */
.search-input-inner::placeholder {
  color: #9ca3af;
}
</style>
