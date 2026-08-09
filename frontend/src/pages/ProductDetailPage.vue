<template>
  <q-page class="product-detail-page q-pa-lg bg-grey-2">
    <!-- breadcrumb -->
    <div class="q-mb-md">
      <q-breadcrumbs class="text-grey-7 text-body2">
        <q-breadcrumbs-el label="หน้าหลัก" />
        <q-breadcrumbs-el :label="product?.category.name || 'กำลังโหลด...'" />
        <q-breadcrumbs-el :label="product?.name || 'กำลังโหลด...'" />
      </q-breadcrumbs>
    </div>
    <div class="product-main-card q-mb-md q-pa-md">
      <div class="row q-col-gutter-lg">
        <!-- ซ้าย: รูปสินค้า + thumbnail -->
        <div class="col-12 col-md-6">
          <ProductGallery
            :images="productImages.map((p) => 'http://localhost:3000' + p.imageUrl)"
            :name="product?.name ?? ''"
          />

          
        </div>

        <!-- กลาง: ข้อมูลหลักสินค้า -->
        <div class="col-12 col-md-6">
          <q-card class="product-main-card q-pa-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-xs">
              {{ product?.name }}
            </div>
            <div class="text-caption text-grey-7 q-mb-md">
              ขายแล้ว {{ product?.soldCount }} | รีวิว {{ product?.ratingCount }} | คะแนนเฉลี่ย
              {{ product?.ratingAvg }} / 5
            </div>

            <!-- ตัวเลือกสี/ไซส์ (มาจาก ProductOption/ProductOptionValue จริง) -->
            <div v-for="opt in productOptions" :key="opt.id" class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ opt.displayName }}</div>
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

            <!-- ราคา -->
            <div class="q-mb-md">
              <div class="row items-baseline q-gutter-sm">
                <div class="text-h5 text-weight-bold">฿{{ product?.price.toLocaleString() }}</div>
                <div class="text-body2 text-grey-6 line-through">
                  <!-- ฿{{ product?.originalPrice.toLocaleString() }} -->
                </div>
              </div>
            </div>

            <!-- ปุ่ม -->
            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                class="btn-add-cart"
                icon="shopping_cart"
                label="เพิ่มไปยังรถเข็น"
                no-caps
                unelevated
                :loading="addingToCart"
                @click="handleAddToCart"
              />
              <q-btn
                class="btn-buy-now"
                label="ซื้อตอนนี้"
                no-caps
                unelevated
                :loading="addingToCart"
                @click="handleBuyNow"
              />
            </div>
          </q-card>
          
          

          <!-- การ์ดร้านค้า -->
          <q-card flat bordered class="seller-card q-pa-md q-mt-md">
            <div class="row items-center justify-between q-gutter-md">
              <div class="col-auto">
                <div class="row items-center q-gutter-md">
                  <q-avatar square size="48px">
                    <!-- <img :src="seller.logo" /> -->
                  </q-avatar>
                  <div class="column">
                    <div class="text-body2 text-weight-medium">Adidas Thailand</div>
                    <div class="text-caption text-grey-6">ผู้ติดตาม 20k</div>
                  </div>
                </div>
                <div class="row q-mt-sm text-caption text-grey-7">
                  <div class="col-auto q-pr-lg">
                    คะแนนเฉลี่ย
                    <span class="text-deep-purple-5 text-weight-medium">
                      {{ product?.ratingAvg }} / 5
                    </span>
                  </div>
                  <div class="col-auto">รีวิวทั้งหมด {{ product?.ratingCount }}</div>
                </div>
              </div>
              <div class="col-auto row q-gutter-sm">
                <q-btn outline no-caps class="q-px-md" icon="storefront" label="ไปที่ร้านค้า" />
                <q-btn
                  outline
                  no-caps
                  class="q-px-md"
                  icon="chat_bubble_outline"
                  label="สอบถามร้านค้า"
                />
              </div>
            </div>
          </q-card>
        </div>
      </div>
</div>
        <!-- ขวา: ข้อมูลสินค้า + summary รีวิว -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="side-info-card q-pa-md">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">ข้อมูลของสินค้า</div>

            <div class="text-caption text-grey-7 q-mb-md">
              หมวดหมู่: {{ product?.category.name }}
            </div>

            <div class="text-subtitle2 text-weight-medium q-mb-sm">รายละเอียดสินค้า</div>
            <div
              class="text-caption text-grey-8 q-mb-md product-description"
              :class="{ 'product-description--expanded': descExpanded }"
            >
              {{ product?.description }}
            </div>

            <q-btn
              v-if="product?.description"
              outline
              dense
              no-caps
              class="q-px-md q-mb-md full-width"
              :label="descExpanded ? 'ย่อรายละเอียด' : 'แสดงรายละเอียดเพิ่มเติม'"
              @click="descExpanded = !descExpanded"
            />
          </q-card>

          <q-card flat bordered class="side-info-card q-pa-md q-mt-md">
            <q-btn outline dense no-caps class="full-width" label="ดูรีวิวทั้งหมด" />
          </q-card>
        </div>
      

      <!-- สินค้าที่ใกล้เคียงกัน -->
      <div class="q-mt-xl">
        <div class="text-subtitle1 text-weight-medium q-mb-md">สินค้าที่ใกล้เคียงกัน</div>
      </div>
    </q-page>
  </template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ProductGallery from 'src/components/ProductDetail/ProductGallery.vue';
import type { Product, ProductImage, ProductOption, ProductOptionValue } from 'src/models';
import { useRoute, useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { api } from 'src/boot/axios';
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
  await Promise.all([
    fetchProductDetail(productId.value),
    fetchProductImages(productId.value),
    fetchProductOptions(productId.value),
  ]);
});

const fetchProductDetail = async (id: string | string[]) => {
  loading.value = true;
  try {
    const safeId = String(id);
    const res = await api.get(`/products/${safeId}`);
    product.value = res.data;
  } catch (err) {
    console.error('Error fetching product:', err);
  } finally {
    loading.value = false;
  }
};

const fetchProductImages = async (id: string | string[]) => {
  loading.value = true;
  try {
    const safeId = String(id);
    const res = await api.get(`/product-images/${safeId}`);
    productImages.value = res.data;
  } catch (err) {
    console.error('Error fetching product:', err);
  } finally {
    loading.value = false;
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
.product-detail-page {
  min-height: 100vh;
}

/* การ์ดภาพหลัก */
.main-image-card {
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
}
.main-image {
  border-radius: 24px;
}


/* การ์ดกลาง */
.product-main-card {
  border-radius: 24px;
  background: #ffffff;
}

/* สี */
.color-dot {
  border: 2px solid #e0e0e0;
}
.color-dot:hover {
  border-color: #a855f7;
}
.color-dot--active {
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.15);
}

/* ไซส์ */
.size-pill {
  min-width: 40px;
  border-radius: 999px;
  background: #f5f5f5;
}
.size-pill--active {
  background: #a855f7;
  color: #ffffff;
}

/* ปุ่ม */
.btn-add-cart {
  flex: 1;
  border-radius: 999px;
  background: #ffffff;
  color: #a855f7;
  border: 1px solid #a855f7;
}
.btn-buy-now {
  flex: 1;
  border-radius: 999px;
  background: #a855f7;
  color: #ffffff;
}

/* การ์ดร้านค้า & side info */
.seller-card,
.side-info-card {
  border-radius: 20px;
  background: #ffffff;
}

/* similar products */
.scroll-x {
  overflow-x: auto;
}
.similar-card {
  width: 200px;
  border-radius: 20px;
  background: #ffffff;
}
</style>
