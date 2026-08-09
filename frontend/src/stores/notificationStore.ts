import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export interface Notification {
  id: number;
  type: 'order' | 'promo' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    unreadCount: (state) => state.notifications.filter((n) => !n.isRead).length,
  },

  actions: {
    async fetchNotifications() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get<Notification[]>('/notifications');
        this.notifications = response.data;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }, message?: string };
        this.error = error.response?.data?.message || error.message || 'Failed to fetch notifications';
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(id: number) {
      try {
        await api.patch(`/notifications/${id}/read`);
        const index = this.notifications.findIndex((n) => n.id === id);
        if (index !== -1 && this.notifications[index]) {
          this.notifications[index].isRead = true;
        }
      } catch (err: unknown) {
        console.error('Failed to mark notification as read:', err);
      }
    },

    async markAllAsRead() {
      try {
        await api.patch('/notifications/read-all');
        this.notifications.forEach((n) => {
          n.isRead = true;
        });
      } catch (err: unknown) {
        console.error('Failed to mark all notifications as read:', err);
      }
    },
  },
});
