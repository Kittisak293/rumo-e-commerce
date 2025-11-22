<template>
  <div class="product-card">
    <div class="product-card__image-wrap">
      <img :src="image || '/product-images/unknown.jpg'" :alt="name" />
    </div>

    <div class="product-card__body">
      <div class="product-card__name row item-start">
        <img class="mall-image" v-if="storeType === 'mall'" :src="mallLogo" alt="Mall" />
        <span class="product-card__name-text">
          {{ name }}
        </span>
      </div>

      <div class="product-card__price">฿{{ price.toLocaleString('th-TH') }}</div>

      <div class="product-card__meta">
        <span>ขายแล้ว {{ sold }} ชิ้น</span>
        <span>คะแนนรีวิว {{ rating }}/5</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  image: string;
  name: string;
  price: number;
  sold: number;
  rating: number;
  storeType?: 'mall' | 'seller';
}>();

import mallLogo from 'src/assets/ui/mall2_purple.png';
</script>

<style scoped>
.product-card {
  width: 180px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

/* กล่องรูปด้านบน */
.product-card__image-wrap {
  background: #f4f4f5;
  padding: 6px;
  border-bottom: 1px solid #e5e7eb;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.product-card__image-wrap img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  border-radius: 20px;
}

/* เนื้อหาด้านล่าง */
.product-card__body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* ดัน price + meta ลงล่าง */
  min-height: 150px; /* ให้สูงเท่า ๆ กันทุกใบ */
}

.product-card__name {
  font-size: 15px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.3;

  /* fix ความสูง title = ไม่ดันราคา */
  max-height: 40px; /* ประมาณ 2 บรรทัด */
  min-height: 40px;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2; /* standard */
  -webkit-line-clamp: 2; /* ตัดไม่เกิน 2 บรรทัด */
  -webkit-box-orient: vertical;
}

.product-card__price {
  font-size: 22px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 6px;
}

.product-card__meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}

.mall-image {
  max-height: 10%;
  max-width: 10%;
}

.product-card__name-text {
  margin-left: 3px;
}
</style>
