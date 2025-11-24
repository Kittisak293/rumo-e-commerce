<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm">
      <img :src="likeLogo" alt="" style="width: 90px; height: 90px" />
      <span style="font-size: 40px; font-weight: 700; color: #8a33ff">
        {{ selectedCategoryName }}
      </span>
      <q-space />
      <q-btn
        class="category-button"
        label="หมวดหมู่ ▼"
        @click="categoryOpen = true"
        :ripple="false"
        rounded
      />
      <q-btn
        class="filter-button"
        label="เรียงตาม ▼"
        @click="filterOpen = true"
        :ripple="false"
        rounded
      />
    </div>
    <div v-if="loading">กำลังค้นหา...</div>

    <div v-else>
      <div v-if="products.length === 0" class="text-grey not-found">ไม่พบสินค้า</div>

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

  <q-dialog v-model="filterOpen" persistent>
    <q-card style="width: 720px; max-width: 95vw; border-radius: 16px">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-weight-medium">เรียงตาม</div>
        <q-btn flat round icon="X" @click="filterClose()" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="text-subtitle2">เรียงลำดับ</div>
        <q-btn-toggle
          :ripple="false"
          v-model="localSortBy"
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
              v-model.number="localPriceMin"
              type="number"
              dense
              outlined
              placeholder="ราคาต่ำสุด"
            />
          </div>
          <div class="col">
            <q-input
              v-model.number="localPriceMax"
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
          :color="localRatingMin === opt.value ? 'primary' : 'grey-3'"
          :text-color="localRatingMin === opt.value ? 'white' : 'black'"
          @click="toggleRating(opt.value)"
        />

        <q-separator />

        <div class="text-subtitle2">ร้านค้า</div>
        <q-btn-toggle
          :ripple="false"
          v-model="localStoreType"
          unelevated
          rounded
          toggle-color="primary"
          text-color="black"
          :options="[
            { label: 'ทั้งหมด', value: 'all' },
            { label: 'Mall', value: 'mall' },
            { label: 'ร้านค้าทั่วไป', value: 'seller' },
          ]"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="between" class="q-pa-md">
        <q-btn flat label="ล้างทั้งหมด" color="grey-8" @click="resetFilters" />
        <q-btn rounded color="primary" label="ดูสินค้าตามตัวกรอง" @click="applyFilters" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="categoryOpen" persistent>
    <q-card style="width: 1300px; max-width: 95vw; border-radius: 16px">
      <q-card-section class="row items-center justify-between">
        <div></div>
        <div class="text-h4 text-weight-medium">หมวดหมู่สินค้า</div>
        <q-btn flat round icon="X" @click="categoryOpen = false" />
      </q-card-section>

      <div class="category-grid">
        <div v-for="p in categories" :key="p.id">
          <CategoryCard
            :key="p.id"
            :id="p.id"
            :image="'http://localhost:3000' + p.imageUrl"
            :name="p.name"
            @selectCategory="handleCategorySelect"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import ProductCard from 'src/components/ProductCard.vue';
import { useProductStore } from 'src/stores/productStore';
import { onMounted, ref } from 'vue';
import likeLogo from 'src/assets/ui/like.png';
import type { Product, Category } from 'src/models';
import { api } from 'src/boot/axios';
import CategoryCard from 'src/components/CategoryCard.vue';
import { useCategoryStore } from 'src/stores/categoryStore';

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const productStore = useProductStore();
const categoryStore = useCategoryStore();
onMounted(async () => {
  await productStore.getProducts();
  await categoryStore.getCategories();
  products.value = productStore.products;
  categories.value = categoryStore.categories;
});
const selectedCategoryName = ref('สินค้าแนะนำประจำวัน');
const loading = ref(false);
const filterOpen = ref(false);
const categoryOpen = ref(false);
const sortBy = ref<'relevant' | 'popular' | 'latest' | 'priceAsc' | 'priceDesc'>('relevant');
const priceMin = ref<number | null>(null);
const priceMax = ref<number | null>(null);
const ratingMin = ref<number | null>(null);
const storeType = ref<'all' | 'mall' | 'seller'>('all');
const categoryId = ref<number | null>(null);
const ratingOptions = [
  { label: '5★', value: 5 },
  { label: '≥4★', value: 4 },
  { label: '≥3★', value: 3 },
  { label: '≥2★', value: 2 },
  { label: '≥1★', value: 1 },
];

const resetFilters = () => {
  localSortBy.value = 'relevant';
  localPriceMin.value = null;
  localPriceMax.value = null;
  localRatingMin.value = null;
  localStoreType.value = 'all';
};

const applyFilters = async () => {
  sortBy.value = localSortBy.value;
  storeType.value = localStoreType.value;
  priceMin.value = localPriceMin.value;
  priceMax.value = localPriceMax.value;
  ratingMin.value = localRatingMin.value;
  const params = {
    sortBy: sortBy.value,
    storeType: storeType.value !== 'all' ? storeType.value : undefined,
    priceMin: priceMin.value ?? undefined,
    priceMax: priceMax.value ?? undefined,
    ratingMin: ratingMin.value ?? undefined,
    categoryId: categoryId.value ?? undefined,
  };

  loading.value = true;
  try {
    const res = await api.get('/products/home', { params });
    products.value = res.data;
  } finally {
    loading.value = false;
    localSortBy.value = sortBy.value;
    localStoreType.value = storeType.value;
    localPriceMin.value = priceMin.value;
    localPriceMax.value = priceMax.value;
    localRatingMin.value = ratingMin.value;
  }

  filterOpen.value = false;
};

const toggleRating = (val: number) => {
  localRatingMin.value = localRatingMin.value === val ? null : val;
};

const handleCategorySelect = async (selectedId: number) => {
  const selectCategory = categories.value.find((c) => c.id === selectedId);
  selectedCategoryName.value = selectCategory?.name
    ? 'หมวดหมู่' + selectCategory.name
    : 'สินค้าแนะนำประจำวัน';
  categoryId.value = selectedId;
  const params = {
    sortBy: sortBy.value,
    storeType: storeType.value !== 'all' ? storeType.value : undefined,
    priceMin: priceMin.value ?? undefined,
    priceMax: priceMax.value ?? undefined,
    ratingMin: ratingMin.value ?? undefined,
    categoryId: categoryId.value ?? undefined,
  };

  loading.value = true;
  try {
    const res = await api.get('/products/category', { params });
    products.value = res.data;
  } finally {
    loading.value = false;
    resetFilters();
    await applyFilters();
  }
  categoryOpen.value = false;
};

const filterClose = () => {
  filterOpen.value = false;
  loading.value = false;
  localSortBy.value = sortBy.value;
  localStoreType.value = storeType.value;
  localPriceMin.value = priceMin.value;
  localPriceMax.value = priceMax.value;
  localRatingMin.value = ratingMin.value;
};

const localSortBy = ref<'relevant' | 'popular' | 'latest' | 'priceAsc' | 'priceDesc'>('relevant');
const localPriceMin = ref<number | null>(null);
const localPriceMax = ref<number | null>(null);
const localRatingMin = ref<number | null>(null);
const localStoreType = ref<'all' | 'mall' | 'seller'>('all');
</script>

<style scoped>
.product-grid {
  display: flex;
  flex-wrap: wrap; /* ทำให้สุดขอบขวาแล้วลงมาบรรทัดใหม่จดๆๆ */
  gap: 16px; /* ระยะห่างระหว่างการ์ด */
}

.not-found {
  margin: 10px 0 0 30px;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  text-align: center;
  margin: 0 50px 70px 70px;
}
</style>
