<template>
  <q-page padding>
    <div>First Page</div>
    <ProductCard
      :image="ShoeImg"
      name="ADIDAS Adizero EVO SL"
      :price="5800"
      :sold="53"
      :rating="4.9"
    />
  </q-page>
</template>

<script setup lang="ts">
import ProductCard from 'src/components/ProductCard.vue';
</script>
