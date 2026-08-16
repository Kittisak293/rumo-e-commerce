import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { Product } from 'src/models';
import { ref } from 'vue';

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  storeType?: 'mall' | 'seller';
}

function describeError(err: unknown, fallback: string): string {
  const error = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return error.message || fallback;
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const actionLoading = ref(false);
  const actionError = ref<string | null>(null);

  function clearActionError() {
    actionError.value = null;
  }

  async function getProducts(silent = false) {
    if (!silent) loading.value = true;
    error.value = null;
    try {
      const res = await api.get<Product[]>('/products');
      products.value = res.data;
    } catch (err: unknown) {
      console.error(err);
      error.value = describeError(err, 'ไม่สามารถโหลดรายการสินค้าได้');
    } finally {
      if (!silent) loading.value = false;
    }
  }

  async function getMallProducts() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<Product[]>('/products/mall');
      products.value = res.data;
    } catch (err: unknown) {
      console.error(err);
      error.value = describeError(err, 'ไม่สามารถโหลดรายการสินค้า Mall ได้');
    } finally {
      loading.value = false;
    }
  }

  async function getSearchProducts() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<Product[]>('/products/search');
      products.value = res.data;
    } catch (err: unknown) {
      console.error(err);
      error.value = describeError(err, 'ไม่สามารถค้นหาสินค้าได้');
    } finally {
      loading.value = false;
    }
  }

  async function addProduct(
    p: Partial<Product> | ProductFormData,
    file: File | null,
  ): Promise<boolean> {
    actionLoading.value = true;
    actionError.value = null;
    try {
      const formData = new FormData();
      if (p.name !== undefined) formData.append('name', p.name);
      if (p.description !== undefined)
        formData.append('description', p.description);
      if (p.price !== undefined) formData.append('price', String(p.price));
      if (p.stock !== undefined) formData.append('stock', String(p.stock));
      if (p.categoryId !== undefined)
        formData.append('categoryId', String(p.categoryId));
      if (p.storeType !== undefined)
        formData.append('storeType', p.storeType);
      if (file) {
        formData.append('imageUrl', file);
      }
      await api.post('/products', formData);
      Notify.create({
        color: 'positive',
        position: 'top',
        message: 'เพิ่มสินค้าสำเร็จ',
        icon: 'check_circle',
      });
      await getProducts(true);
      return true;
    } catch (err: unknown) {
      console.error(err);
      actionError.value = describeError(err, 'เพิ่มสินค้าไม่สำเร็จ');
      Notify.create({
        color: 'negative',
        position: 'top',
        message: actionError.value,
        icon: 'report_problem',
      });
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateProduct(
    id: number,
    p: Partial<Product> | ProductFormData,
    file: File | null,
  ): Promise<boolean> {
    actionLoading.value = true;
    actionError.value = null;
    try {
      const formData = new FormData();
      if (p.name !== undefined) formData.append('name', p.name);
      if (p.description !== undefined)
        formData.append('description', p.description);
      if (p.price !== undefined) formData.append('price', String(p.price));
      if (p.stock !== undefined) formData.append('stock', String(p.stock));
      if (p.categoryId !== undefined)
        formData.append('categoryId', String(p.categoryId));
      if (p.storeType !== undefined)
        formData.append('storeType', p.storeType);
      if (file) {
        formData.append('imageUrl', file);
      }
      await api.patch(`/products/${id}`, formData);
      Notify.create({
        color: 'positive',
        position: 'top',
        message: 'แก้ไขสินค้าสำเร็จ',
        icon: 'check_circle',
      });
      await getProducts(true);
      return true;
    } catch (err: unknown) {
      console.error(err);
      actionError.value = describeError(err, 'แก้ไขสินค้าไม่สำเร็จ');
      Notify.create({
        color: 'negative',
        position: 'top',
        message: actionError.value,
        icon: 'report_problem',
      });
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function delProduct(target: Product | number): Promise<boolean> {
    const id = typeof target === 'number' ? target : target.id;
    actionLoading.value = true;
    actionError.value = null;
    try {
      await api.delete('/products/' + id);
      Notify.create({
        color: 'positive',
        position: 'top',
        message: 'ลบสินค้าสำเร็จ',
        icon: 'check_circle',
      });
      await getProducts(true);
      return true;
    } catch (err: unknown) {
      console.error(err);
      actionError.value = describeError(err, 'ลบสินค้าไม่สำเร็จ');
      Notify.create({
        color: 'negative',
        position: 'top',
        message: actionError.value,
        icon: 'report_problem',
      });
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    products,
    loading,
    error,
    actionLoading,
    actionError,
    clearActionError,
    addProduct,
    delProduct,
    updateProduct,
    getProducts,
    getMallProducts,
    getSearchProducts,
  };
});
