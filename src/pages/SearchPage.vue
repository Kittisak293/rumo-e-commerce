<template>
  <q-page class="q-pa-lg">
    <div class="text-h6 q-mb-md">ผลการค้นหา: "{{ route.query.q }}"</div>

    <div v-if="loading">กำลังค้นหา...</div>

    <div v-else>
      <div v-if="products.length === 0" class="text-grey">ไม่พบสินค้า</div>

      <div v-else class="row q-col-gutter-md">
        <ProductCard
          v-for="p in products"
          :key="p.id"
          :image="p.imageUrl"
          :name="p.name"
          :price="p.price"
          :sold="p.soldCount"
          :rating="p.ratingAvg"
          :storeType="p.storeType"
        />
      </div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'src/boot/axios';
import ProductCard from 'src/components/ProductCard.vue';
import { type Product } from 'src/models';

const route = useRoute();
const products = ref<Product[]>([]);
const loading = ref(false);

const loadSearch = async () => {
  const q = (route.query.q || '').toString().trim();
  if (!q) {
    products.value = [];
    return;
  }

  loading.value = true;
  try {
    const res = await api.get('/products/search', { params: { q } });
    products.value = res.data;
  } finally {
    loading.value = false;
  }
};

watch(() => route.query.q, loadSearch, { immediate: true });
</script>
<style scoped></style>
