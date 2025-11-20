<template>
  <div class="product-card">
    <!-- ส่วนรูป -->
    <div class="product-card__image-wrap">
      <img :src="image" :alt="name" />
    </div>

    <!-- ส่วนเนื้อหา -->
    <div class="product-card__body">
      <div class="product-card__name">
        {{ name }}
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
const props = defineProps<{
  image: string;
  name: string;
  price: number;
  sold: number;
  rating: number;
}>();
</script>

<style scoped>
.product-card {
  width: 230px;
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
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.product-card__image-wrap img {
  width: 100%;
  border-radius: 20px;
  object-fit: cover;
}

/* เนื้อหาด้านล่าง */
.product-card__body {
  padding: 12px 14px 14px;
}

.product-card__name {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 8px;
}

.product-card__price {
  font-size: 22px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.product-card__meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}
</style>
