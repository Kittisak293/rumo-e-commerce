<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm" style="margin: 5px 0 0 25px">
      <img :src="mallLogo" alt="" style="width: 42px; height: 42px" />
      <div></div>
      <div></div>
      <span style="font-size: 40px; font-weight: 700; color: #8a33ff"> RUMO MALL </span>
    </div>

    <div class="product-grid">
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
  </q-page>

  <q-dialog v-model="filterOpen" persistent>
    <q-card style="width: 720px; max-width: 95vw; border-radius: 16px">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">เรียงตาม</div>
        <q-btn flat round icon="X" @click="filterOpen = false" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="text-subtitle2">เรียงลำดับ</div>
        <q-btn-toggle
          :ripple="false"
          v-model="sortBy"
          unelevated
          rounded
          toggle-color="primary"
          text-color="black"
          :options="[
            { label: 'ที่เกี่ยวข้อง', value: 'relevant' },
            { label: 'ยอดนิยม', value: 'popular' },
            { label: 'ล่าสุด', value: 'latest' },
            { label: 'ราคาต่ำไปสูง', value: 'priceAsc' },
            { label: 'ราคาสูงไปต่ำ', value: 'priceDesc' },
          ]"
        />

        <q-separator />

        <div class="text-subtitle2">ราคา</div>
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input
              v-model.number="priceMin"
              type="number"
              dense
              outlined
              placeholder="ราคาต่ำสุด"
            />
          </div>
          <div class="col">
            <q-input
              v-model.number="priceMax"
              type="number"
              dense
              outlined
              placeholder="ราคาสูงสุด"
            />
          </div>
        </div>

        <q-separator />

        <div class="text-subtitle2">คะแนน</div>
        <q-btn
          v-for="opt in ratingOptions"
          :ripple="false"
          :key="opt.value"
          unelevated
          rounded
          :label="opt.label"
          :color="ratingMin === opt.value ? 'primary' : 'grey-3'"
          :text-color="ratingMin === opt.value ? 'white' : 'black'"
          @click="toggleRating(opt.value)"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="between" class="q-pa-md">
        <q-btn flat label="ล้างทั้งหมด" color="grey-8" @click="resetFilters" />
        <q-btn rounded color="primary" label="ดูสินค้าตามตัวกรอง" @click="applyFilters" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import ProductCard from 'src/components/ProductCard.vue';
import { useProductStore } from 'src/stores/productStore';
import { onMounted, ref } from 'vue';
import mallLogo from 'src/assets/ui/mall2_purple.png';
import { type Product } from 'src/models';
import { api } from 'src/boot/axios';

const products = ref<Product[]>([]);
const productStore = useProductStore();
onMounted(async () => {
  await productStore.getMallProducts();
  products.value = productStore.products;
});

const loading = ref(false);
const filterOpen = ref(false);
const sortBy = ref<'relevant' | 'popular' | 'latest' | 'priceAsc' | 'priceDesc'>('relevant');
const priceMin = ref<number | null>(null);
const priceMax = ref<number | null>(null);
const ratingMin = ref<number | null>(null);
const ratingOptions = [
  { label: '5★', value: 5 },
  { label: '≥4★', value: 4 },
  { label: '≥3★', value: 3 },
  { label: '≥2★', value: 2 },
  { label: '≥1★', value: 1 },
];

const resetFilters = () => {
  sortBy.value = 'relevant';
  priceMin.value = null;
  priceMax.value = null;
  ratingMin.value = null;
};

const applyFilters = async () => {
  const params = {
    sortBy: sortBy.value,
    storeType: undefined,
    priceMin: priceMin.value ?? undefined,
    priceMax: priceMax.value ?? undefined,
    ratingMin: ratingMin.value ?? undefined,
  };

  loading.value = true;
  try {
    const res = await api.get('/products/home', { params });
    products.value = res.data;
  } finally {
    loading.value = false;
  }

  filterOpen.value = false;
};

const toggleRating = (val: number) => {
  ratingMin.value = ratingMin.value === val ? null : val;
};
</script>

<style scoped>
.product-grid {
  display: flex;
  flex-wrap: wrap; /* ทำให้สุดขอบขวาแล้วลงมาบรรทัดใหม่จดๆๆ */
  gap: 16px; /* ระยะห่างระหว่างการ์ด */
  margin-top: 17px;
}
</style>
