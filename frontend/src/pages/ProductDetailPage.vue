<template>
  <q-page class="pdp-page">
    <!-- Loading -->
    <div v-if="loading" class="pdp-skeleton">
      <div class="card" style="height: 500px">
        <div class="skeleton-bar" style="width: 100%; height: 100%; border-radius: 14px" />
      </div>
      <div class="card">
        <div class="skeleton-bar" style="width: 60%; height: 20px; margin-bottom: 14px" />
        <div class="skeleton-bar" style="width: 40%; height: 14px; margin-bottom: 22px" />
        <div class="skeleton-bar" style="width: 30%; height: 30px" />
      </div>
    </div>

    <!-- Loaded -->
    <div v-else class="pdp-content">
      <div class="pdp-breadcrumb">
        <router-link :to="{ name: 'home' }">หน้าแรก</router-link>
        <span class="pdp-breadcrumb-sep">/</span>
        <span v-if="product?.category">{{ product.category.name }}</span>
        <span v-if="product?.category" class="pdp-breadcrumb-sep">/</span>
        {{ product?.name }}
      </div>

      <div class="pdp-grid">
        <!-- ซ้าย: รูปสินค้า + รายละเอียด -->
        <div class="pdp-grid__left">
          <div class="card pdp-gallery-card">
            <ProductGallery :images="galleryImages" :name="product?.name ?? ''" />
          </div>

          <div class="card">
            <div class="card__title">รายละเอียดสินค้า</div>
            <div class="pdp-meta-line">หมวดหมู่: {{ product?.category.name }}</div>
            <div
              class="pdp-description"
              :class="{ 'pdp-description--expanded': descExpanded }"
            >
              {{ product?.description }}
            </div>
            <button
              v-if="product?.description"
              type="button"
              class="pdp-btn pdp-btn--secondary"
              style="margin-top: 12px"
              @click="descExpanded = !descExpanded"
            >
              {{ descExpanded ? 'ย่อรายละเอียด' : 'แสดงรายละเอียดเพิ่มเติม' }}
            </button>
          </div>

          <div class="card">
            <button type="button" class="pdp-btn pdp-btn--secondary">ดูรีวิวทั้งหมด</button>
          </div>
        </div>

        <!-- ขวา: ซื้อสินค้า + ร้านค้า -->
        <div class="pdp-grid__right">
          <div class="card">
            <div class="pdp-title">{{ product?.name }}</div>
            <div class="pdp-meta-line">
              ขายแล้ว {{ product?.soldCount }} | รีวิว {{ product?.ratingCount }} | คะแนนเฉลี่ย
              {{ product?.ratingAvg }} / 5
            </div>

            <div v-for="opt in productOptions" :key="opt.id" class="pdp-option">
              <div class="pdp-option__label">{{ opt.displayName }}</div>
              <div class="row q-gutter-sm">
                <template v-if="isColorOption(opt)">
                  <q-btn
                    v-for="val in opt.values"
                    :key="val.id"
                    round
                    dense
                    unelevated
                    class="color-dot"
                    :class="{ 'color-dot--active': selectedValueId[opt.id] === val.id }"
                    :style="{ backgroundColor: val.valueCode }"
                    @click="selectedValueId[opt.id] = val.id"
                  >
                    <q-tooltip>{{ val.value }}</q-tooltip>
                  </q-btn>
                </template>
                <template v-else>
                  <q-btn
                    v-for="val in opt.values"
                    :key="val.id"
                    dense
                    no-caps
                    class="size-pill"
                    :class="{ 'size-pill--active': selectedValueId[opt.id] === val.id }"
                    @click="selectedValueId[opt.id] = val.id"
                    :label="val.value"
                  />
                </template>
              </div>
            </div>

            <div class="pdp-price">฿{{ product?.price.toLocaleString() }}</div>

            <div class="row q-gutter-sm">
              <button
                type="button"
                class="pdp-btn pdp-btn--secondary pdp-btn--flex"
                :disabled="addingToCart"
                @click="handleAddToCart"
              >
                <q-icon name="shopping_cart" size="18px" class="q-mr-xs" />
                เพิ่มไปยังรถเข็น
              </button>
              <button
                type="button"
                class="pdp-btn pdp-btn--primary pdp-btn--flex"
                :disabled="addingToCart"
                @click="handleBuyNow"
              >
                ซื้อตอนนี้
              </button>
            </div>
          </div>

          <div class="card pdp-seller-card">
            <div class="row items-center q-gutter-md">
              <q-avatar square size="48px" class="pdp-seller-avatar" />
              <div class="column">
                <div class="pdp-seller-name">Adidas Thailand</div>
                <div class="pdp-meta-line">ผู้ติดตาม 20k</div>
              </div>
            </div>
            <div class="pdp-meta-line q-mt-sm">
              คะแนนเฉลี่ย
              <span class="pdp-seller-rating">{{ product?.ratingAvg }} / 5</span>
              &nbsp;|&nbsp; รีวิวทั้งหมด {{ product?.ratingCount }}
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <button type="button" class="pdp-btn pdp-btn--secondary pdp-btn--flex">
                <q-icon name="storefront" size="18px" class="q-mr-xs" />ไปที่ร้านค้า
              </button>
              <button type="button" class="pdp-btn pdp-btn--secondary pdp-btn--flex">
                <q-icon name="chat_bubble_outline" size="18px" class="q-mr-xs" />สอบถามร้านค้า
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- สินค้าที่ใกล้เคียงกัน -->
      <div class="card q-mt-md">
        <div class="card__title">สินค้าที่ใกล้เคียงกัน</div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ProductGallery from 'src/components/ProductDetail/ProductGallery.vue';
import type { Product, ProductImage, ProductOption, ProductOptionValue } from 'src/models';
import { useRoute, useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { api } from 'src/boot/axios';
import { getImageUrl } from 'src/utils/imageUrl';
import { useAuthStore } from 'src/stores/authStore';
import { useCartStore } from 'src/stores/cartStore';

interface ProductOptionWithValues extends ProductOption {
  values: ProductOptionValue[];
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

const productImages = ref<ProductImage[]>([]);
const productId = ref<string | string[]>('');
const loading = ref(true);
const addingToCart = ref(false);
const descExpanded = ref(false);
const productOptions = ref<ProductOptionWithValues[]>([]);
const selectedValueId = ref<Record<number, number>>({});

onMounted(async () => {
  productId.value = route.params.id ?? '';
  loading.value = true;
  try {
    await Promise.all([
      fetchProductDetail(productId.value),
      fetchProductImages(productId.value),
      fetchProductOptions(productId.value),
    ]);
  } finally {
    loading.value = false;
  }
});

const fetchProductDetail = async (id: string | string[]) => {
  try {
    const safeId = String(id);
    const res = await api.get(`/products/${safeId}`);
    product.value = res.data;
  } catch (err) {
    console.error('Error fetching product:', err);
  }
};

const fetchProductImages = async (id: string | string[]) => {
  try {
    const safeId = String(id);
    const res = await api.get(`/product-images/${safeId}`);
    productImages.value = res.data;
  } catch (err) {
    console.error('Error fetching product:', err);
  }
};

const fetchProductOptions = async (id: string | string[]) => {
  try {
    const safeId = String(id);
    const { data: options } = await api.get<ProductOption[]>('/product-options', {
      params: { productId: safeId },
    });

    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const { data: values } = await api.get<ProductOptionValue[]>('/product-option-values', {
          params: { productOptionId: option.id },
        });
        return { ...option, values: [...values].sort((a, b) => a.sortOrder - b.sortOrder) };
      }),
    );

    productOptions.value = optionsWithValues.sort((a, b) => a.sortOrder - b.sortOrder);

    for (const option of productOptions.value) {
      const firstValue = option.values[0];
      if (firstValue) selectedValueId.value[option.id] = firstValue.id;
    }
  } catch (err) {
    console.error('Error fetching product options:', err);
  }
};

const isColorOption = (option: ProductOptionWithValues) =>
  option.name.toLowerCase().includes('color') || option.displayName.includes('สี');

const product = ref<Product | null>(null);

// Most products only ever get a single cover image (`Product.imageUrl`) —
// the `product_image` gallery table stays empty unless someone explicitly
// uploads extra shots via the admin product form. Falling back to the cover
// image keeps the gallery from rendering blank for those products, even
// though "the product clearly has an image" (it shows fine on cards).
const galleryImages = computed(() => {
  if (productImages.value.length > 0) {
    return productImages.value.map((p) => getImageUrl(p.imageUrl));
  }
  return product.value?.imageUrl ? [getImageUrl(product.value.imageUrl)] : [];
});

const addToCart = async (): Promise<boolean> => {
  if (!authStore.user) {
    Notify.create({
      color: 'warning',
      position: 'top',
      message: 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า',
    });
    await router.push({ name: 'login' });
    return false;
  }
  if (!product.value) return false;

  addingToCart.value = true;
  try {
    await api.post('/cart-item', {
      quantity: 1,
      price: product.value.price,
      productId: product.value.id,
      userId: authStore.user.id,
    });
    void cartStore.fetchCount();
    return true;
  } catch (err) {
    console.error('Error adding to cart:', err);
    Notify.create({ color: 'negative', position: 'top', message: 'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ' });
    return false;
  } finally {
    addingToCart.value = false;
  }
};

const handleAddToCart = async () => {
  const ok = await addToCart();
  if (ok) {
    Notify.create({
      color: 'positive',
      position: 'top',
      message: 'เพิ่มสินค้าลงตะกร้าแล้ว',
      icon: 'shopping_cart',
    });
  }
};

const handleBuyNow = async () => {
  const ok = await addToCart();
  if (ok) {
    await router.push({ name: 'checkout' });
  }
};
</script>

<style scoped>
.pdp-page {
  padding: 28px 40px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.pdp-breadcrumb {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
  overflow-wrap: anywhere;
}

.pdp-breadcrumb a {
  color: #8e4dff;
  text-decoration: none;
}

.pdp-breadcrumb-sep {
  color: #d1d5db;
  margin: 0 4px;
}

.pdp-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.pdp-grid__left,
.pdp-grid__right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.pdp-grid__right {
  position: sticky;
  top: 24px;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.card__title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 14px;
}

.pdp-gallery-card {
  padding: 16px;
}

.pdp-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.pdp-meta-line {
  font-size: 12.5px;
  color: #9ca3af;
  margin-bottom: 14px;
  line-height: 1.6;
}

.pdp-option {
  margin-bottom: 16px;
}

.pdp-option__label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
}

.color-dot {
  width: 32px;
  height: 32px;
  border: 2px solid #e5e7eb;
}
.color-dot:hover {
  border-color: #6d28d9;
}
.color-dot--active {
  border-color: #6d28d9;
  box-shadow: 0 0 0 2px rgba(109, 40, 217, 0.15);
}

.size-pill {
  min-width: 40px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #1d1d1d;
}
.size-pill--active {
  background: #6d28d9;
  color: #ffffff;
}

.pdp-price {
  font-size: 30px;
  font-weight: 700;
  color: #6d28d9;
  letter-spacing: -0.5px;
  margin-bottom: 18px;
}

.pdp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  font-size: 14.5px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  box-sizing: border-box;
  border: none;
}

.pdp-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pdp-btn--flex {
  flex: 1;
}

.pdp-btn--primary {
  color: #fff;
  background: #6d28d9;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.pdp-btn--secondary {
  width: 100%;
  background: #fff;
  color: #6d28d9;
  border: 1px solid #6d28d9;
}

.pdp-seller-card {
  background: #f5f3ff;
}

.pdp-seller-avatar {
  background: #ede9fe;
  border-radius: 10px;
}

.pdp-seller-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1d;
}

.pdp-seller-rating {
  color: #6d28d9;
  font-weight: 600;
}

.pdp-description {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.7;
  max-height: 4.8em;
  overflow: hidden;
}

.pdp-description--expanded {
  max-height: none;
}

.pdp-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}

.skeleton-bar {
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (max-width: 860px) {
  .pdp-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
  .pdp-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .pdp-grid__right {
    position: static;
  }
  .card {
    padding: 16px;
    border-radius: 14px;
  }
  .pdp-gallery-card {
    padding: 10px;
  }
  .pdp-title {
    font-size: 18px;
  }
  .pdp-price {
    font-size: 26px;
    margin-bottom: 14px;
  }
  .pdp-seller-card .row.q-gutter-sm {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .pdp-page {
    padding: 16px 12px 32px;
  }
  .row.q-gutter-sm > .pdp-btn--flex {
    flex: 1 1 100%;
  }
}
</style>
