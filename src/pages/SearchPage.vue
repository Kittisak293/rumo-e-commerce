<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm" style="margin: 5px 0 0 25px">
      <span style="font-size: 40px; font-weight: 700; color: #8a33ff">
        ผลการค้นหา: "{{ route.query.q }}"
      </span>
    </div>

    <div v-if="loading">กำลังค้นหา...</div>

    <div v-else>
      <div v-if="products.length === 0" class="text-grey">ไม่พบสินค้า</div>

      <div v-else class="product-grid">
        <div v-for="p in products" :key="p.id">
          <ProductCard
            :key="p.id"
            :image="'http://localhost:3000' + p.imageUrl"
            :name="p.name"
            :price="p.price"
            :sold="p.soldCount"
            :rating="p.ratingAvg"
            :storeType="p.storeType"
          />
        </div>
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

<style scoped>
.product-grid {
  display: flex;
  flex-wrap: wrap; /* ทำให้สุดขอบขวาแล้วลงมาบรรทัดใหม่จดๆๆ */
  gap: 16px; /* ระยะห่างระหว่างการ์ด */
}
</style>
