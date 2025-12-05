<template>
  <div class="row q-col-gutter-md">
    <div class="col-auto">
      <div class="column q-gutter-y-sm items-center">
        <button class="icon-click">
          <img :src="arrowIcon" alt="arrowIcon" style="width: 12px" class="arrowIcon" />
        </button>

        <div
          v-for="(img, index) in images"
          :key="index"
          class="thumbnail-card cursor-pointer"
          :class="{ 'active-thumbnail': selectedIndex === index }"
          @mouseover="selectedIndex = index"
        >
          <q-img :src="img" class="rounded-borders" style="width: 60px; height: 60px" fit="cover" />
        </div>

        <button class="icon-click">
          <img :src="arrowDownIcon" alt="arrowIcon" style="width: 12px" class="arrowIcon" />
        </button>

        <q-chip clickable color="grey-2" text-color="black" size="sm"> ดูรูปทั้งหมด </q-chip>
      </div>
    </div>

    <div class="col">
      <div class="main-image-container bg-grey-2 rounded-borders flex flex-center">
        <q-img
          :src="currentImage"
          fit="contain"
          style="max-height: 500px; width: 100%"
          spinner-color="primary"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import arrowIcon from 'src/assets/icons/arrow.png';
import arrowDownIcon from 'src/assets/icons/arrow_down.png';

// รับ Props เป็น Array ของ URL รูปภาพ (String)
const props = defineProps<{
  images: string[];
}>();

const selectedIndex = ref(0);

// คำนวณรูปปัจจุบันที่จะโชว์
const currentImage = computed(() => {
  if (props.images && props.images.length > 0) {
    return props.images[selectedIndex.value];
  }
  return ''; // หรือใส่รูป Placeholder กรณีไม่มีรูป
});

// Reset กลับไปรูปแรกเสมอถ้ารายการรูปเปลี่ยน (เช่น เปลี่ยนสินค้า)
watch(
  () => props.images,
  () => {
    selectedIndex.value = 0;
  },
);
</script>

<style scoped>
.thumbnail-card {
  border: 2px solid transparent; /* ขอบปกติใสไว้ */
  border-radius: 12px;
  padding: 2px;
  transition: all 0.2s;
}

/* สไตล์ตอนเลือกรูป (ขอบสีม่วงตามแบบ) */
.active-thumbnail {
  border-color: #8a33ff;
}

.main-image-container {
  min-height: 400px; /* ความสูงขั้นต่ำของรูปใหญ่ */
  padding: 20px;
}

/* รูปมีเงาตาม PNG */
.icon-click img {
  transition: 0.01s ease;
}

/* effect ตอนกด */
.icon-click:active img {
  transform: scale(0.92);
}

.icon-click:active {
  transform: scale(0.92);
}

.icon-click {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: none; /* เอาเส้นขอบออก */
  background: #c2c2c2; /* สีพื้นหลัง (ปรับได้) */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* เงานิด ๆ */
  transition: all 0.2s ease;
}
</style>
