<template>
  <div class="category-card" @click="handleClick">
    <div class="category-card">
      <div class="category-card__image-wrap">
        <img :src="image || '/category-images/unknown.jpg'" :alt="name" />
      </div>

      <div class="category-card__body">
        <div class="category-card__name-text">
          {{ name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  image: string;
  name: string;
  id: number;
}>();

const emit = defineEmits(['selectCategory']);
const handleClick = () => {
  emit('selectCategory', props.id);
};
</script>

<style scoped>
.category-card {
  width: 180px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border: 1px solid #d3d3d3;
}

/* กล่องรูปด้านบน */
.category-card__image-wrap {
  background: #f4f4f5;
  padding: 6px;
  border-bottom: 1px solid #e5e7eb;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-card__image-wrap img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  border-radius: 20px;
}

/* เนื้อหาด้านล่าง */
.category-card__body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* ดัน price + meta ลงล่าง */
  min-height: 50px; /* ให้สูงเท่า ๆ กันทุกใบ */
}

.category-card__name {
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

.category-card__price {
  font-size: 22px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 6px;
}

.category-card__meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}

.mall-image {
  max-height: 10%;
  max-width: 10%;
}

.category-card__name-text {
  margin-left: 3px;
  font-size: 16.5px;
}
</style>
