import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import type { Category } from 'src/models';
import { ref } from 'vue';

function describeError(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return error.message || fallback;
}

export const useCategoryStore = defineStore('Category', () => {
  const categories = ref<Category[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const actionLoading = ref(false);
  const actionError = ref<string | null>(null);

  function clearActionError() {
    actionError.value = null;
  }

  async function getCategories() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<Category[]>('/category');
      categories.value = res.data;
    } catch (err: unknown) {
      error.value = describeError(err, 'โหลดรายการหมวดหมู่ไม่สำเร็จ');
    } finally {
      loading.value = false;
    }
  }

  // `imageUrl` is the field name the backend's FileInterceptor listens on
  // (`FileInterceptor('imageUrl')`) — appending under any other key gets the
  // file silently dropped and the category falls back to unknown.jpg.
  async function addCategory(name: string, file: File | null): Promise<boolean> {
    actionLoading.value = true;
    actionError.value = null;
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (file) {
        formData.append('imageUrl', file);
      }
      await api.post('/category', formData);
      await getCategories();
      return true;
    } catch (err: unknown) {
      actionError.value = describeError(err, 'เพิ่มหมวดหมู่ไม่สำเร็จ');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateCategory(id: number, name: string, file: File | null): Promise<boolean> {
    actionLoading.value = true;
    actionError.value = null;
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (file) {
        formData.append('imageUrl', file);
      }
      await api.patch(`/category/${id}`, formData);
      await getCategories();
      return true;
    } catch (err: unknown) {
      actionError.value = describeError(err, 'แก้ไขหมวดหมู่ไม่สำเร็จ');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function delCategory(id: number): Promise<boolean> {
    actionLoading.value = true;
    actionError.value = null;
    try {
      await api.delete(`/category/${id}`);
      categories.value = categories.value.filter((c) => c.id !== id);
      return true;
    } catch (err: unknown) {
      actionError.value = describeError(err, 'ลบหมวดหมู่ไม่สำเร็จ');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    categories,
    loading,
    error,
    actionLoading,
    actionError,
    clearActionError,
    getCategories,
    addCategory,
    updateCategory,
    delCategory,
  };
});
