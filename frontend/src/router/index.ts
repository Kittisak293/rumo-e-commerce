import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/authStore';
import type { OtpPurpose } from 'src/models';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    const auth = useAuthStore();

    // `requiresAuth` is opt-in per route; nothing carries it yet.
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    if (to.meta.guestOnly && auth.isAuthenticated) {
      return auth.user?.role === 'admin' ? { name: 'account' } : { name: 'home' };
    }

    if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
      return { name: 'home' };
    }

    // The OTP and reset screens are meaningless without a live challenge — a
    // deep link or a reload after it was consumed has to start over.
    const required = to.meta.requiresChallenge as OtpPurpose[] | undefined;
    if (required && !(auth.otpPurpose && required.includes(auth.otpPurpose))) {
      return { name: 'login' };
    }

    return true;
  });

  return Router;
});
