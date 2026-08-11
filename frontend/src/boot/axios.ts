import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from 'src/stores/authStore';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: import.meta.env.VITE_API || 'http://localhost:3000' });

// Read straight from storage rather than the Pinia store: boot files run before
// any store exists, and this avoids a circular import with authStore.
const TOKEN_KEY = 'rumo.accessToken';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default defineBoot(({ app, router }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to use this.$axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  // An expired or rejected access token means the stored session is dead. Drop
  // it and send the user to login — but never bounce them out of the auth
  // screens themselves, where 401 is an ordinary "wrong code" answer.
  api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : '';
      if (status === 401 && !url.startsWith('/auth/')) {
        // Clear the Pinia store, not just storage — leaving the store's
        // accessToken/user refs stale kept isAuthenticated truthy after an
        // expired token was rejected, so the UI still showed the account
        // menu while every subsequent request kept 401ing.
        useAuthStore().logout();
        void router.push({ name: 'login' });
      }
      return Promise.reject(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
  );
});

export { api };
