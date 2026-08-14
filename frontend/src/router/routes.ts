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
      { path: 'notifications', name: 'notifications', component: () => import('pages/NotificationsPage.vue') },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('pages/CheckoutPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'checkout/confirm',
        name: 'checkoutConfirm',
        component: () => import('pages/CheckoutConfirmPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'payment-success/:orderId',
        name: 'paymentSuccess',
        component: () => import('pages/PaymentSuccessPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('pages/OrdersPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'orders/:orderId',
        name: 'orderDetail',
        component: () => import('pages/OrderDetailPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'orders/:orderId/tracking',
        name: 'orderTracking',
        component: () => import('pages/OrderTrackingPage.vue'),
        meta: { requiresAuth: true },
      },
      { path: 'product', name: 'product', component: () => import('pages/ProductDetailPage.vue') },
      {
        path: 'products/:id',
        name: 'productDetail',
        component: () => import('pages/ProductDetailPage.vue'),
      },
    ],
  },

  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/auth/LoginPage.vue'),
        meta: { guestOnly: true },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('pages/auth/RegisterPage.vue'),
        meta: { guestOnly: true },
      },
      {
        // Shared by the login second factor and signup email verification —
        // which one is live is decided by the challenge in the auth store.
        path: 'verify',
        name: 'verifyOtp',
        component: () => import('pages/auth/OtpPage.vue'),
        meta: { guestOnly: true, requiresChallenge: ['login', 'verifyEmail'] },
      },
      {
        path: 'forgot-password',
        name: 'forgotPassword',
        component: () => import('pages/auth/ForgotPasswordPage.vue'),
        meta: { guestOnly: true },
      },
      {
        path: 'reset-password',
        name: 'resetPassword',
        component: () => import('pages/auth/ResetPasswordPage.vue'),
        meta: { guestOnly: true, requiresChallenge: ['passwordReset'] },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
