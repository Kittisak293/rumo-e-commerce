import { defineStore } from 'pinia';
import { Loading, Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { ProductImage } from 'src/models';
import { ref } from 'vue';

export const useProductImageStore = defineStore('ProductImage', () => {
  const productImages = ref<ProductImage[]>([]);

  async function addProduct(p: ProductImage, file: File | null) {
    const formData = new FormData();
    formData.append('productId', String(p.productId));
    formData.append('index', String(p.index));
    if (file) {
      formData.append('file', file);
    }
    await api.post('/product-images', formData);
    await getProductImages();
  }

  async function delProductImage(p: ProductImage) {
    try {
      Loading.show();
      const res = await api.delete('/product-images/' + p.id);
      console.log(res.data);
      await getProductImages();
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

  async function updateProduct(id: number, p: ProductImage, file: File | null) {
    const formData = new FormData();
    formData.append('productId', String(p.productId));
    formData.append('index', String(p.index));
    if (file) {
      formData.append('file', file);
    }
    await api.patch(`/product-images/${id}`, formData);
    await getProductImages();
  }

  async function getProductImages() {
    try {
      Loading.show();
      const res = await api.get('/product-images');
      console.log(res.data);
      productImages.value = res.data;
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

  return {
    productImages,
    addProduct,
    delProductImage,
    updateProduct,
    getProductImages,
  };
});
