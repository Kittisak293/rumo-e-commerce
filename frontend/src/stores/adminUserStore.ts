import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export interface AdminUserData {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  age: number | null;
  emailVerified: boolean;
  createdAt: string;
}

function describeError(err: unknown, fallback: string): string {
  const error = err as {
    response?: { status?: number; data?: { message?: string | string[] } };
    message?: string;
  };
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return error.message || fallback;
}

export const useAdminUserStore = defineStore('adminUser', {
  state: () => ({
    users: [] as AdminUserData[],
    loading: false,
    error: null as string | null,
    actionLoading: false,
    actionError: null as string | null,
  }),

  getters: {
    adminCount(state): number {
      return state.users.filter((u) => u.role === 'admin').length;
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get<AdminUserData[]>('/users');
        this.users = res.data;
      } catch (err: unknown) {
        this.error = describeError(err, 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },

    // Server re-enforces both the self-change (403) and last-admin (409)
    // rules independently of the UI's own disabled-button checks — the row
    // data driving those checks can be stale by the time the dialog submits.
    async changeRole(userId: number, role: 'admin' | 'customer'): Promise<boolean> {
      this.actionLoading = true;
      this.actionError = null;
      try {
        const res = await api.patch<AdminUserData>(`/users/${userId}/role`, { role });
        const idx = this.users.findIndex((u) => u.id === userId);
        if (idx !== -1) this.users[idx] = res.data;
        return true;
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 403) {
          this.actionError = 'เปลี่ยนบทบาทของตัวเองไม่ได้';
        } else if (error.response?.status === 409) {
          this.actionError = 'ต้องมีแอดมินอย่างน้อย 1 คน — ปลดคนนี้ไม่ได้';
        } else if (error.response?.status === 404) {
          this.actionError = 'ไม่พบผู้ใช้นี้แล้ว อาจถูกลบไปก่อนหน้านี้';
        } else {
          this.actionError = describeError(err, 'เปลี่ยนบทบาทไม่สำเร็จ');
        }
        return false;
      } finally {
        this.actionLoading = false;
      }
    },

    clearActionError() {
      this.actionError = null;
    },
  },
});
