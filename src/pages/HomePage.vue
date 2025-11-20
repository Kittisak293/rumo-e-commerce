<template>
  <q-page padding>
    <div class="product-grid">
      <div v-for="p in productStore.products" :key="p.id">
        <ProductCard
          :key="p.id"
          :image="p.imageUrl"
          :name="p.name"
          :price="p.price"
          :sold="p.soldCount"
          :rating="p.ratingAvg"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import ProductCard from 'src/components/ProductCard.vue';
import { useProductStore } from 'src/stores/productStore';
import { onMounted } from 'vue';
const productStore = useProductStore();
onMounted(async () => {
  await productStore.getProducts();
});
</script>

<style scoped>
.product-grid {
  display: flex;
  flex-wrap: wrap; /* ทำให้สุดขอบขวาแล้วลงมาบรรทัดใหม่จดๆๆ */
  gap: 16px; /* ระยะห่างระหว่างการ์ด */
  padding: 16px 0;
}
</style>
