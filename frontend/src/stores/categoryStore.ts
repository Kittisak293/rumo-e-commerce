import { defineStore } from 'pinia';
import { Loading, Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { Category } from 'src/models';
import { ref } from 'vue';

export const useCategoryStore = defineStore('Category', () => {
  const categories = ref<Category[]>([]);

  async function addCategory(p: Category, file: File | null) {
    const formData = new FormData();
    formData.append('name', p.name);
    if (file) {
      formData.append('file', file);
    }
    await api.post('/category', formData);
    await getCategories();
  }

  async function delCategory(p: Category) {
    try {
      Loading.show();
      const res = await api.delete('/category/' + p.id);
      console.log(res.data);
      await getCategories();
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

  async function updateCategory(id: number, p: Category, file: File | null) {
    const formData = new FormData();
    formData.append('name', p.name);
    if (file) {
      formData.append('file', file);
    }
    await api.patch(`/category/${id}`, formData);
    await getCategories();
  }

  async function getCategories() {
    try {
      Loading.show();
      const res = await api.get('/category');
      console.log(res.data);
      categories.value = res.data;
    } catch (err) {
      console.error(err);
      Notify.create({
        color: 'negative',
        position: 'top',
        message: 'Loading failed',
        icon: 'report_problem',
      });
    } finally {
      // console.log('finally');
      Loading.hide();
    }
  }

  return {
    categories,
    addCategory,
    delCategory,
    updateCategory,
    getCategories,
  };
});
