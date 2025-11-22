<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm" style="margin: 5px 0 0 25px">
      <img :src="mallLogo" alt="" style="width: 42px; height: 42px" />
      <div></div>
      <div></div>
      <span style="font-size: 40px; font-weight: 700; color: #8a33ff"> RUMO MALL </span>
    </div>

    <div class="product-grid">
      <div v-for="p in productStore.products" :key="p.id">
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
  </q-page>
</template>

<script setup lang="ts">
import ProductCard from 'src/components/ProductCard.vue';
import { useProductStore } from 'src/stores/productStore';
import { onMounted } from 'vue';
const productStore = useProductStore();
onMounted(async () => {
  await productStore.getMallProducts();
});
import mallLogo from 'src/assets/ui/mall2_purple.png';
</script>

<style scoped>
.product-grid {
  display: flex;
  flex-wrap: wrap; /* ทำให้สุดขอบขวาแล้วลงมาบรรทัดใหม่จดๆๆ */
  gap: 16px; /* ระยะห่างระหว่างการ์ด */
}
</style>
