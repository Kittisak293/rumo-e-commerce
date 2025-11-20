import { defineStore } from 'pinia';
import { Loading, Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { Product } from 'src/models';
import { ref } from 'vue';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);

  async function addProduct(p: Product, file: File | null) {
    try {
      Loading.show();
      const formData = new FormData();
      formData.append('name', String(p.name));
      formData.append('description', String(p.description));
      formData.append('price', String(p.price));
      formData.append('stock', String(p.stock));
      formData.append('categoryId', String(p.categoryId));
      formData.append('ratingAvg', String(p.ratingAvg));
      formData.append('ratingCount', String(p.ratingCount));
      formData.append('soldCount', String(p.soldCount));
      if (file) {
        formData.append('file', file);
      }
      const res = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(res.data);
      await getProducts();
    } catch (err) {
      console.error(err);
      Notify.create({
        color: 'negative',
        position: 'top',
        message: 'Add failed',
        icon: 'report_problem',
      });
    } finally {
      // Loading.hide()
    }
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

  async function updateProduct(p: Product, file: File | null) {
    try {
      Loading.show();
      const formData = new FormData();
      formData.append('name', String(p.name));
      formData.append('description', String(p.description));
      formData.append('price', String(p.price));
      formData.append('stock', String(p.stock));
      formData.append('categoryId', String(p.categoryId));
      formData.append('ratingAvg', String(p.ratingAvg));
      formData.append('ratingCount', String(p.ratingCount));
      formData.append('soldCount', String(p.soldCount));
      if (file) {
        formData.append('file', file);
      }
      const res = await api.patch('/products/' + p.id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(res.data);
      await getProducts();
    } catch (err) {
      console.error(err);
      Notify.create({
        color: 'negative',
        position: 'top',
        message: 'Update failed',
        icon: 'report_problem',
      });
    } finally {
      console.log('finally');
      Loading.hide();
    }
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

  return { products, addProduct, delProduct, updateProduct, getProducts };
});
