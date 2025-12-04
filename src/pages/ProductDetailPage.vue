<template>
  <q-page class="product-detail-page q-pa-lg bg-grey-2">
    <!-- breadcrumb -->
    <div class="q-mb-md">
      <q-breadcrumbs class="text-grey-7 text-body2">
        <q-breadcrumbs-el label="หน้าหลัก" icon="home" />
        <q-breadcrumbs-el label="รองเท้า" />
        <q-breadcrumbs-el :label="product.name" />
      </q-breadcrumbs>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- ซ้าย: รูปสินค้า + thumbnail -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="main-image-card">
          <q-img :src="selectedImage" ratio="1" class="main-image" />
        </q-card>

        <div class="row q-mt-md">
          <!-- ปุ่มเลื่อนขึ้นลง (ใน figma อยู่ซ้าย) -->
          <div class="col-auto flex column items-center justify-center q-pr-sm">
            <q-btn round dense flat icon="keyboard_arrow_up" class="thumb-arrow" />
            <q-btn round dense flat icon="keyboard_arrow_down" class="thumb-arrow q-mt-xs" />
          </div>

          <!-- thumbnail list -->
          <div class="col">
            <div class="row no-wrap q-gutter-sm thumb-list">
              <q-img
                v-for="img in product.images"
                :key="img"
                :src="img"
                ratio="1"
                class="thumb-item"
                :class="{ 'thumb-item--active': img === selectedImage }"
                @click="selectedImage = img"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- กลาง: ข้อมูลหลักสินค้า -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="product-main-card q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
            {{ product.name }}
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            ขายแล้ว {{ product.soldText }} | รีวิว {{ product.reviewCount }} | คะแนนเฉลี่ย
            {{ product.rating }} / 5
          </div>

          <!-- ตัวเลือกสี -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">สี</div>
            <div class="row q-gutter-sm">
              <q-btn
                v-for="color in product.colors"
                :key="color.id"
                round
                dense
                unelevated
                class="color-dot"
                :style="{ backgroundColor: color.hex }"
                :outline="color.id !== selectedColorId"
                @click="selectedColorId = color.id"
              />
            </div>
          </div>

          <!-- ตัวเลือกไซส์ -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">ไซส์</div>
            <div class="row q-gutter-sm">
              <q-btn
                v-for="size in product.sizes"
                :key="size"
                dense
                no-caps
                class="size-pill"
                :class="{ 'size-pill--active': size === selectedSize }"
                @click="selectedSize = size"
                :label="size"
              />
            </div>
          </div>

          <!-- ราคา -->
          <div class="q-mb-md">
            <div class="row items-baseline q-gutter-sm">
              <div class="text-h5 text-weight-bold">฿{{ product.price.toLocaleString() }}</div>
              <div class="text-body2 text-grey-6 line-through">
                ฿{{ product.originalPrice.toLocaleString() }}
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
              <img :src="seller.logo" />
            </q-avatar>
            <div class="column">
              <div class="text-body2 text-weight-medium">
                {{ seller.name }}
              </div>
              <div class="text-caption text-grey-6">ผู้ติดตาม {{ seller.followerText }}</div>
            </div>
          </div>

          <div class="row q-mt-sm text-caption text-grey-7">
            <div class="col-auto q-pr-lg">
              คะแนนเฉลี่ย
              <span class="text-deep-purple-5 text-weight-medium"> {{ seller.rating }} / 5 </span>
            </div>
            <div class="col-auto">รีวิวทั้งหมด {{ seller.reviewCount }}</div>
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

          <div class="text-caption text-grey-7 q-mb-sm">หมวดหมู่: {{ product.categoryPath }}</div>
          <div class="text-caption text-grey-7 q-mb-md">แบรนด์: {{ product.brand }}</div>

          <div class="text-caption text-grey-8 q-mb-md">
            {{ product.shortDescription }}
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
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2 text-weight-medium">
              คะแนนและรีวิวสินค้า ({{ product.reviewCount }})
            </div>
            <q-btn dense flat no-caps icon="filter_list" label="Filter" />
          </div>

          <div class="row items-center q-gutter-sm q-mb-sm">
            <div class="text-h6 text-weight-bold">
              {{ product.rating }}
            </div>
            <q-rating
              size="18px"
              v-model="ratingModel"
              max="5"
              color="amber"
              icon="star"
              readonly
            />
            <div class="text-caption text-grey-7">/ 5</div>
          </div>

          <div class="row q-gutter-xs text-caption text-grey-7 q-mb-sm">
            <q-chip v-for="chip in reviewChips" :key="chip" dense>{{ chip }}</q-chip>
          </div>

          <q-separator spaced />

          <!-- example review preview -->
          <div class="row items-center q-gutter-sm q-mb-xs">
            <q-avatar size="24px">
              <img :src="reviewPreview.avatar" />
            </q-avatar>
            <div class="text-caption text-weight-medium">
              {{ reviewPreview.user }}
            </div>
          </div>
          <q-rating
            size="16px"
            v-model="reviewPreview.stars"
            max="5"
            color="amber"
            icon="star"
            readonly
            class="q-mb-xs"
          />
          <div class="text-caption text-grey-8 q-mb-sm">
            {{ reviewPreview.comment }}
          </div>

          <q-btn outline dense no-caps class="full-width" label="ดูรีวิวทั้งหมด" />
        </q-card>
      </div>
    </div>

    <!-- สินค้าที่ใกล้เคียงกัน -->
    <div class="q-mt-xl">
      <div class="text-subtitle1 text-weight-medium q-mb-md">สินค้าที่ใกล้เคียงกัน</div>

      <div class="row no-wrap q-gutter-md scroll-x">
        <q-card v-for="item in similarProducts" :key="item.id" flat bordered class="similar-card">
          <q-img :src="item.image" ratio="4/3" />
          <div class="q-pa-sm">
            <div class="text-caption text-weight-medium ellipsis">
              {{ item.name }}
            </div>
            <div class="text-body2 text-weight-bold">฿{{ item.price.toLocaleString() }}</div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ColorOption {
  id: number;
  hex: string;
}

interface Product {
  name: string;
  soldText: string;
  reviewCount: number;
  rating: number;
  price: number;
  originalPrice: number;
  categoryPath: string;
  brand: string;
  shortDescription: string;
  images: string[];
  colors: ColorOption[];
  sizes: string[];
}

interface Seller {
  name: string;
  followerText: string;
  rating: number;
  reviewCount: number;
  logo: string;
}

interface SimilarProduct {
  id: number;
  name: string;
  price: number;
  image: string;
}

const product = ref<Product>({
  name: 'ADIDAS Adizero EVO SL',
  soldText: '53 ชิ้น',
  reviewCount: 37,
  rating: 4.9,
  price: 5800,
  originalPrice: 6000,
  categoryPath: 'รองเท้า > รองเท้าวิ่ง',
  brand: 'ADIDAS',
  shortDescription:
    'สัมผัสประสบการณ์การวิ่งที่เบาสบายด้วย ADIZERO EVO SL รองรับแรงกระแทกได้ดี เหมาะสำหรับการวิ่งระยะไกลและฝึกซ้อมประจำวัน.',
  images: [
    '/images/shoes/main.jpg',
    '/images/shoes/angle1.jpg',
    '/images/shoes/angle2.jpg',
    '/images/shoes/angle3.jpg',
    '/images/shoes/angle4.jpg',
  ],
  colors: [
    { id: 1, hex: '#ffffff' },
    { id: 2, hex: '#000000' },
    { id: 3, hex: '#ffcd00' },
    { id: 4, hex: '#9b59b6' },
  ],
  sizes: ['39', '40', '41', '42', '43'],
});

const seller = ref<Seller>({
  name: 'Adidas Thailand official',
  followerText: '300k',
  rating: 4.6,
  reviewCount: 300,
  logo: '/images/brands/adidas-logo.png',
});

const similarProducts = ref<SimilarProduct[]>([
  {
    id: 1,
    name: 'ADIDAS Adizero Boston 12',
    price: 5200,
    image: '/images/similar/1.jpg',
  },
  {
    id: 2,
    name: 'ADIDAS Adizero SL',
    price: 4800,
    image: '/images/similar/2.jpg',
  },
  {
    id: 3,
    name: 'ADIDAS Supernova Rise',
    price: 4500,
    image: '/images/similar/3.jpg',
  },
]);

const selectedImage = ref(product.value.images[0]);
const selectedColorId = ref<number>(product.value.colors[0].id);
const selectedSize = ref<string>(product.value.sizes[1]);

const ratingModel = ref(product.value.rating);

const reviewChips = ref<string[]>(['ทั้งหมด (37)', 'ให้ 5 ดาว (33)', 'รูปภาพ/วีดีโอ (15)']);

const reviewPreview = ref({
  user: 'ธนา***',
  avatar: '/images/users/user1.jpg',
  stars: 5,
  comment: 'รองเท้านุ่มมาก ใส่วิ่งแล้วไม่ปวดเท้า ส่งของเร็ว แนะนำเลยครับ!',
});
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
