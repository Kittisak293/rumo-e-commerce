<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm">
      <img :src="likeLogo" alt="" style="width: 90px; height: 90px" />
      <span style="font-size: 40px; font-weight: 700; color: #8a33ff"> สินค้าแนะนำประจำวัน </span>
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
  await productStore.getHomeProducts();
});
import likeLogo from 'src/assets/ui/like.png';
</script>

<style scoped>
.product-grid {
  display: flex;
  flex-wrap: wrap; /* ทำให้สุดขอบขวาแล้วลงมาบรรทัดใหม่จดๆๆ */
  gap: 16px; /* ระยะห่างระหว่างการ์ด */
}
</style>
