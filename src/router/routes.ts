import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'mall', name: 'mall', component: () => import('pages/MallPage.vue') },
      { path: 'coupon', name: 'coupon', component: () => import('pages/CouponPage.vue') },
      { path: 'search', name: 'search', component: () => import('pages/SearchPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
