import { defineStore } from 'pinia';
import { Loading, Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { Product } from 'src/models';
import { ref } from 'vue';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);

  async function addProduct(p: Product, file: File | null) {
    const formData = new FormData();
    formData.append('name', p.name);
    formData.append('description', p.description);
    formData.append('price', String(p.price));
    formData.append('stock', String(p.stock));
    formData.append('categoryId', String(p.categoryId));
    if (file) {
      formData.append('file', file);
    }
    await api.post('/products', formData);
    await getProducts();
  }

  async function delProduct(p: Product) {
    try {
      Loading.show();
      const res = await api.delete('/products/' + p.id);
      console.log(res.data);
      await getProducts();
    } catch (err) {
      console.error(err);
      Notify.create({
        color: 'negative',
        position: 'top',
        message: 'Delete failed',
        icon: 'report_problem',
      });
    } finally {
      console.log('finally');
      Loading.hide();
    }
  }

  async function updateProduct(id: number, p: Product, file: File | null) {
    const formData = new FormData();
    formData.append('name', p.name);
    formData.append('description', p.description);
    formData.append('price', String(p.price));
    formData.append('stock', String(p.stock));
    formData.append('categoryId', String(p.categoryId));
    if (file) {
      formData.append('file', file);
    }
    await api.patch(`/products/${id}`, formData);
    await getProducts();
  }

  async function getProducts() {
    try {
      Loading.show();
      const res = await api.get('/products');
      console.log(res.data);
      products.value = res.data;
    } catch (err) {
      console.error(err);
      Notify.create({
        color: 'negative',
        position: 'top',
        message: 'Loading failed',
        icon: 'report_problem',
      });
    } finally {
      console.log('finally');
      Loading.hide();
    }
  }

  async function getMallProducts() {
    try {
      Loading.show();
      const res = await api.get('/products/mall');
      console.log(res.data);
      products.value = res.data;
    } catch (err) {
      console.error(err);
      Notify.create({
        color: 'negative',
        position: 'top',
        message: 'Loading failed',
        icon: 'report_problem',
      });
    } finally {
      console.log('finally');
      Loading.hide();
    }
  }

  return { products, addProduct, delProduct, updateProduct, getProducts, getMallProducts };
});
