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

    <div class="row q-col-gutter-lg">
      <!-- ซ้าย: รูปสินค้า + thumbnail -->
      <div class="col-12 col-md-5">
        <ProductGallery
          :images="productImages.map((p) => 'http://localhost:3000' + p.imageUrl)"
          :name="product?.name ?? ''"
        />

        <div class="row q-mt-md">
          <!-- ปุ่มเลื่อนขึ้นลง (ใน figma อยู่ซ้าย) -->
          <div class="col-auto flex column items-center justify-center q-pr-sm">
            <q-btn round dense flat icon="keyboard_arrow_up" class="thumb-arrow" />
            <q-btn round dense flat icon="keyboard_arrow_down" class="thumb-arrow q-mt-xs" />
          </div>
        </div>
      </div>

      <!-- กลาง: ข้อมูลหลักสินค้า -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="product-main-card q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
            {{ product?.name }}
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            ขายแล้ว {{ product?.soldCount }} | รีวิว {{ product?.ratingCount }} | คะแนนเฉลี่ย
            {{ product?.ratingAvg }} / 5
          </div>

          <!-- ตัวเลือกสี -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">สี</div>
            <div class="row q-gutter-sm">
              <!-- <q-btn
                v-for="color in product.colors"
                :key="color.id"
                round
                dense
                unelevated
                class="color-dot"
                :style="{ backgroundColor: color.hex }"
                :outline="color.id !== selectedColorId"
                @click="selectedColorId = color.id"
              /> -->
            </div>
          </div>

          <!-- ตัวเลือกไซส์ -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">ไซส์</div>
            <div class="row q-gutter-sm">
              <!-- <q-btn
                v-for="size in product.sizes"
                :key="size"
                dense
                no-caps
                class="size-pill"
                :class="{ 'size-pill--active': size === selectedSize }"
                @click="selectedSize = size"
                :label="size"
              /> -->
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
            />
            <q-btn class="btn-buy-now" label="ซื้อตอนนี้" no-caps unelevated />
          </div>
        </q-card>

        <!-- การ์ดร้านค้า -->
        <q-card flat bordered class="seller-card q-pa-md q-mt-md">
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

          <div class="row q-mt-md q-gutter-sm">
            <q-btn outline no-caps class="q-px-md" icon="storefront" label="ไปที่ร้านค้า" />
            <q-btn
              outline
              no-caps
              class="q-px-md"
              icon="chat_bubble_outline"
              label="สอบถามร้านค้า"
            />
          </div>
        </q-card>
      </div>

      <!-- ขวา: ข้อมูลสินค้า + summary รีวิว -->
      <div class="col-12 col-md-3">
        <q-card flat bordered class="side-info-card q-pa-md">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">ข้อมูลของสินค้า</div>

          <!-- <div class="text-caption text-grey-7 q-mb-sm">หมวดหมู่: {{ product.categoryPath }}</div> -->
          <!-- <div class="text-caption text-grey-7 q-mb-md">แบรนด์: {{ product.brand }}</div> -->

          <div class="text-caption text-grey-8 q-mb-md">
            <!-- {{ product.shortDescription }} -->
          </div>

          <q-btn
            outline
            dense
            no-caps
            class="q-px-md q-mb-md full-width"
            label="แสดงรายละเอียดเพิ่มเติม"
          />
        </q-card>

        <q-card flat bordered class="side-info-card q-pa-md q-mt-md">
          <q-btn outline dense no-caps class="full-width" label="ดูรีวิวทั้งหมด" />
        </q-card>
      </div>
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
import type { Product, ProductImage } from 'src/models';
import { useRoute } from 'vue-router';
import { api } from 'src/boot/axios';

const route = useRoute();
const productImages = ref<ProductImage[]>([]);
const productId = ref<string | string[]>('');
const loading = ref(true);

onMounted(async () => {
  productId.value = route.params.id ?? '';
  await fetchProductDetail(productId.value);
  await fetchProductImages(productId.value);
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

const product = ref<Product | null>(null);
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

/* thumbnails */
.thumb-list {
  overflow-x: auto;
}
.thumb-item {
  width: 72px;
  border-radius: 16px;
  cursor: pointer;
  border: 2px solid transparent;
}
.thumb-item--active {
  border-color: #a855f7; /* purple */
}
.thumb-arrow {
  background: #ffffff;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
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
.color-dot[aria-pressed='true'],
.color-dot:hover {
  border-color: #a855f7;
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
