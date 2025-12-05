<template>
  <div class="row q-col-gutter-md">
    <div class="col-auto">
      <div class="column q-gutter-y-sm items-center">
        <button
          class="icon-click"
          @click="scrollUp"
          :disabled="scrollIndex === 0"
          :class="{ 'disabled-btn': scrollIndex === 0 }"
        >
          <img :src="arrowIcon" alt="arrowIcon" style="width: 12px" class="arrowIcon" />
        </button>

        <div
          v-for="item in visibleThumbnails"
          :key="item.originalIndex"
          class="thumbnail-card cursor-pointer"
          :class="{ 'active-thumbnail': selectedIndex === item.originalIndex }"
          @mouseover="selectedIndex = item.originalIndex"
          @click="selectedIndex = item.originalIndex"
        >
          <q-img
            :src="item.img"
            class="rounded-borders"
            style="width: 60px; height: 60px"
            fit="cover"
          />
        </div>

        <button
          class="icon-click"
          @click="scrollDown"
          :disabled="scrollIndex >= maxScrollIndex"
          :class="{ 'disabled-btn': scrollIndex >= maxScrollIndex }"
        >
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
const scrollIndex = ref(0); // ตัวแปรเก็บตำแหน่งเริ่มต้นของการโชว์รูป
const VISIBLE_COUNT = 4; // จำนวนรูปที่จะโชว์

// Computed: ตัดมาเฉพาะรูปที่จะโชว์ และแปะ index เดิมไปด้วย (เพื่อให้ highlight ถูกต้อง)
const visibleThumbnails = computed(() => {
  if (!props.images) return [];

  return props.images
    .map((img, index) => ({ img, originalIndex: index })) // เก็บ index เดิมไว้
    .slice(scrollIndex.value, scrollIndex.value + VISIBLE_COUNT); // ตัดเฉพาะส่วนที่จะโชว์
});

// คำนวณขอบเขตการเลื่อนลงสูงสุด
const maxScrollIndex = computed(() => {
  if (!props.images) return 0;
  return Math.max(0, props.images.length - VISIBLE_COUNT);
});

// ฟังก์ชันเลื่อนขึ้น
const scrollUp = () => {
  if (scrollIndex.value > 0) {
    scrollIndex.value--;
  }
};

// ฟังก์ชันเลื่อนลง
const scrollDown = () => {
  if (scrollIndex.value < maxScrollIndex.value) {
    scrollIndex.value++;
  }
};

// รูปใหญ่ปัจจุบัน
const currentImage = computed(() => {
  if (props.images && props.images.length > 0) {
    return props.images[selectedIndex.value];
  }
  return '';
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
  background: #8e4dff; /* สีพื้นหลัง (ปรับได้) */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* เงานิด ๆ */
  transition: all 0.2s ease;
}

.icon-click:disabled {
  background: #c2c2c2; /* เปลี่ยนเป็นสีเทาเมื่อกดไม่ได้ */
  cursor: not-allowed; /* เปลี่ยนเมาส์เป็นเครื่องหมายห้าม */
  box-shadow: none; /* เอาเงาออกเพื่อให้ดูแบนลง (User รู้สึกว่ากดไม่ได้) */
  opacity: 1; /* ป้องกันไม่ให้ Browser ปรับความจางเอง */
}
</style>
