<script setup lang="ts">
import ProductCard from 'src/components/ProductCard.vue';
import ShoeImg from 'src/assets/shoe-adizero.png'; // รูปรองเท้าของคุณ
</script>

<template>
  <q-page padding class="bg-grey-1">
    <ProductCard
      :image="ShoeImg"
      name="ADIDAS Adizero EVO SL"
      :price="5800"
      :sold="53"
      :rating="4.9"
    />
  </q-page>
</template>
