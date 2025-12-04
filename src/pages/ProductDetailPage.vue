<template>
  <q-page class="product-detail-page bg-grey-2 q-pa-lg">
    <!-- Top breadcrumb -->
    <div class="text-grey-7 text-caption q-mb-sm">
      <q-breadcrumbs separator=">">
        <q-breadcrumbs-el label="หน้าหลัก" />
        <q-breadcrumbs-el label="รองเท้าวิ่ง" />
        <q-breadcrumbs-el label="ADIDAS Adizero EVO SL" />
      </q-breadcrumbs>
    </div>

    <div class="row q-col-gutter-xl">
      <!-- LEFT: Gallery -->
      <div class="col-3">
        <q-card flat class="gallery-card bg-white rounded-xl shadow-soft">
          <div class="q-pa-md">
            <q-img :src="selectedImage" class="main-image rounded-lg" ratio="1" contain />
          </div>

          <div class="thumb-list q-px-md q-pb-md">
            <div class="column items-center">
              <q-btn
                v-for="img in images"
                :key="img.id"
                flat
                dense
                class="thumb-btn q-mb-sm"
                :class="{ 'thumb-active': img.src === selectedImage }"
                @click="selectedImage = img.src"
              >
                <q-img :src="img.src" ratio="1" class="thumb-img rounded-md" />
              </q-btn>

              <q-btn outline rounded color="primary" size="sm" class="q-mt-sm">
                ดูรูปทั้งหมด
              </q-btn>
            </div>
          </div>
        </q-card>
      </div>

      <!-- CENTER: Main info -->
      <div class="col-5">
        <q-card flat class="bg-white rounded-xl shadow-soft q-pa-lg">
          <div class="text-h6 text-weight-bold q-mb-xs">ADIDAS Adizero EVO SL</div>
          <div class="text-caption text-grey-7 q-mb-md">
            ขายแล้ว 53 ชิ้น | 37 รีวิว | คะแนนร้าน 4.9 / 5
          </div>

          <!-- Color option -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">สี</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="color in colors"
                :key="color.code"
                clickable
                class="variant-chip"
                :class="{ 'variant-chip--active': color.code === selectedColor }"
                @click="selectedColor = color.code"
              >
                {{ color.label }}
              </q-chip>
            </div>
          </div>

          <!-- Size option -->
          <div class="q-mb-lg">
            <div class="text-caption text-grey-7 q-mb-xs">ไซส์</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="size in sizes"
                :key="size"
                clickable
                class="size-chip"
                :class="{ 'size-chip--active': size === selectedSize }"
                @click="selectedSize = size"
              >
                {{ size }}
              </q-chip>
            </div>
          </div>

          <!-- Price & buttons -->
          <div class="row items-center q-mb-md">
            <div>
              <div class="text-h5 text-weight-bold text-rumo">฿5,800</div>
              <div class="text-caption text-grey-6 line-through">฿6,000</div>
            </div>
          </div>

          <div class="row q-gutter-sm">
            <q-btn rounded color="white" text-color="primary" class="btn-outline-primary" no-caps>
              <q-icon name="shopping_cart" class="q-mr-sm" />
              เพิ่มไปยังรถเข็น
            </q-btn>

            <q-btn rounded color="primary" no-caps> ซื้อ ตอนนี้ </q-btn>
          </div>
        </q-card>

        <!-- Seller card -->
        <q-card flat class="bg-white rounded-xl shadow-soft q-pa-md q-mt-md seller-card">
          <div class="row items-center">
            <q-avatar size="56px" rounded class="q-mr-md">
              <q-img src="https://placehold.co/80x80?text=Logo" />
            </q-avatar>
            <div class="col">
              <div class="text-body1 text-weight-medium">Adidas Thailand official</div>
              <div class="text-caption text-grey-7">ผู้ติดตาม 300k</div>
              <div class="text-caption text-grey-7">คะแนนเฉลี่ย 4.6 / 5 · รีวิวทั้งหมด 6m</div>
            </div>

            <div class="row q-gutter-sm">
              <q-btn outline rounded color="primary" no-caps size="sm"> ไปร้านค้า </q-btn>
              <q-btn rounded flat color="primary" no-caps size="sm"> สอบถามร้านค้า </q-btn>
            </div>
          </div>
        </q-card>
      </div>

      <!-- RIGHT: Detail & reviews summary -->
      <div class="col-4">
        <q-card flat class="bg-white rounded-xl shadow-soft q-pa-md q-mb-md">
          <div class="text-subtitle1 text-weight-medium q-mb-sm">ข้อมูลของสินค้า</div>
          <div class="text-caption text-grey-7 q-mb-xs">หมวดหมู่: รองเท้าวิ่ง</div>
          <div class="text-caption text-grey-7 q-mb-xs">แบรนด์: ADIDAS</div>
          <div class="text-caption text-grey-7 q-mb-xs">จัดส่งจาก: กรุงเทพมหานคร</div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-weight-medium q-mb-sm">รายละเอียดสินค้า</div>
          <div class="text-caption text-grey-7">
            อธิบายประสบการณ์การวิ่งที่เบาสบายด้วย Adizero EVO SL... (ใส่ข้อความจริงตามที่คุณต้องการ)
          </div>
        </q-card>

        <q-card flat class="bg-white rounded-xl shadow-soft q-pa-md">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <div class="text-subtitle1 text-weight-medium">คะแนนและรีวิวสินค้า (37)</div>
            </div>
            <q-btn
              dense
              outline
              rounded
              size="sm"
              color="grey-7"
              icon-right="filter_list"
              label="Filter"
              no-caps
            />
          </div>

          <div class="row items-center q-mb-sm">
            <div class="text-h6 text-weight-bold q-mr-sm">4.9</div>
            <q-rating v-model="rating" max="5" size="18px" color="amber" />
            <div class="text-caption text-grey-7 q-ml-sm">/ 5</div>
          </div>

          <div class="text-caption text-grey-7 q-mb-md">จากผู้ซื้อจริง 37 คน</div>

          <!-- ตัวอย่างรีวิวสั้น ๆ -->
          <div class="row q-mb-sm">
            <q-avatar size="32px" class="q-mr-sm">
              <img src="https://placehold.co/64x64" />
            </q-avatar>
            <div class="col">
              <div class="text-caption text-weight-medium">คุณ A******</div>
              <q-rating v-model="dummyReviewRating" max="5" size="14px" />
              <div class="text-caption text-grey-7 q-mt-xs">
                ของจริงตรงปก นุ่ม ใส่วิ่งสบาย ส่งไวมาก
              </div>
              <div class="q-mt-xs">
                <q-img
                  v-for="n in 3"
                  :key="n"
                  src="https://placehold.co/80x80"
                  ratio="1"
                  class="q-mr-xs rounded-md review-img"
                />
              </div>
            </div>
          </div>

          <q-btn outline rounded color="primary" no-caps class="q-mt-sm full-width">
            ดูรีวิวทั้งหมด
          </q-btn>
        </q-card>
      </div>
    </div>

    <!-- Related products -->
    <div class="q-mt-xl">
      <div class="text-subtitle1 text-weight-medium q-mb-md">สินค้าที่ใกล้เคียงกัน</div>
      <div class="row q-col-gutter-md">
        <div v-for="n in 5" :key="n" class="col-2">
          <q-card flat class="bg-white rounded-xl shadow-soft related-card">
            <q-img src="https://placehold.co/300x300" ratio="1" class="rounded-t-xl" />
            <div class="q-pa-sm">
              <div class="text-caption ellipsis-2-lines">รองเท้าวิ่งรุ่นตัวอย่าง {{ n }}</div>
              <div class="text-body2 text-weight-bold q-mt-xs">฿3,990</div>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';

const images = [
  { id: 1, src: 'https://placehold.co/600x600?text=Main' },
  { id: 2, src: 'https://placehold.co/600x600?text=Side' },
  { id: 3, src: 'https://placehold.co/600x600?text=Back' },
  { id: 4, src: 'https://placehold.co/600x600?text=Detail' },
];

const selectedImage = ref(images[0].src);

const colors = [
  { code: 'white-black', label: 'ขาว/ดำ' },
  { code: 'black', label: 'ดำ' },
  { code: 'green', label: 'เขียว' },
  { code: 'pink', label: 'ชมพู' },
];

const sizes = [39, 40, 41, 42, 43];

const selectedColor = ref(colors[0].code);
const selectedSize = ref(40);

const rating = ref(4.9);
const dummyReviewRating = ref(5);
</script>

<style scoped>
.product-detail-page {
  max-width: 1280px;
  margin: 0 auto;
}

/* สีหลักตาม RUMO */
.text-rumo {
  color: #8a33ff;
}
.q-btn.bg-primary,
.q-btn--standard.q-btn--rectangle.q-btn--actionable.q-btn--unelevated.bg-primary,
.bg-primary {
  background: linear-gradient(90deg, #a634ff, #7a2cff);
}

/* การ์ด + shadow */
.rounded-xl {
  border-radius: 18px;
}
.shadow-soft {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

/* Gallery */
.main-image {
  background: #f5f5f7;
}
.thumb-btn {
  width: 64px;
  height: 64px;
  padding: 0;
  border-radius: 12px;
  border: 2px solid transparent;
}
.thumb-active {
  border-color: #8a33ff;
}
.thumb-img {
  width: 100%;
  height: 100%;
}

/* Variant chips */
.variant-chip,
.size-chip {
  border-radius: 999px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
}
.variant-chip--active,
.size-chip--active {
  border-color: #8a33ff;
  background: #f4e9ff;
  color: #8a33ff;
}

/* Outline primary btn look */
.btn-outline-primary {
  border: 1px solid #8a33ff;
}

/* Seller card */
.seller-card {
  border-left: 4px solid #f0e2ff;
}

/* Related */
.related-card {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* Utility */
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.review-img {
  border-radius: 10px;
}
</style>
