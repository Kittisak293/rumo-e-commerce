<template>
  <div class="gallery-layout">
    <div class="gallery-layout__main">
      <div class="main-image-container bg-grey-2 rounded-borders flex flex-center">
        <q-img :src="currentImage" fit="cover" style="height: 100%; width: 100%" spinner-color="primary">
          <template #error>
            <div class="img-fallback img-fallback--main">
              <q-icon name="image_not_supported" size="40px" />
              <div class="q-mt-sm">ไม่พบรูปภาพ</div>
            </div>
          </template>
        </q-img>
      </div>
    </div>

    <div class="gallery-layout__rail">
      <button
        class="icon-click rail-arrow"
        @click="scrollUp"
        :disabled="scrollIndex === 0"
        :class="{ 'disabled-btn': scrollIndex === 0 }"
      >
        <img :src="arrowIcon" alt="arrowIcon" style="width: 12px" class="arrowIcon" />
      </button>

      <div class="thumbnail-strip">
        <div
          v-for="item in visibleThumbnails"
          :key="item.originalIndex"
          class="thumbnail-card cursor-pointer"
          :class="{ 'active-thumbnail': selectedIndex === item.originalIndex }"
          @mouseover="selectedIndex = item.originalIndex"
          @click="selectedIndex = item.originalIndex"
        >
          <q-img :src="item.img" class="rounded-borders" style="width: 60px; height: 60px" fit="cover">
            <template #error>
              <div class="img-fallback">
                <q-icon name="image_not_supported" size="18px" />
              </div>
            </template>
          </q-img>
        </div>
      </div>

      <button
        class="icon-click rail-arrow"
        @click="scrollDown"
        :disabled="scrollIndex >= maxScrollIndex"
        :class="{ 'disabled-btn': scrollIndex >= maxScrollIndex }"
      >
        <img :src="arrowDownIcon" alt="arrowIcon" style="width: 12px" class="arrowIcon" />
      </button>

      <button type="button" class="view-all-btn" @click="openDialog()">
        <q-icon name="grid_view" size="14px" class="q-mr-xs" />
        ดูรูปทั้งหมด
      </button>
    </div>
  </div>

  <q-dialog v-model="dialogOpen" transition-show="scale" transition-hide="scale">
    <q-card
      class="gallery-dialog-card"
      style="width: 1200px; max-width: 90vw; height: 80vh; border-radius: 20px; overflow: hidden"
    >
      <q-btn
        icon="X"
        flat
        round
        dense
        v-close-popup
        class="absolute-top-right q-ma-md"
        style="z-index: 10; color: #333"
        size="lg"
      />

      <div class="row full-height gallery-dialog-row">
        <div class="col-12 col-md-8 bg-grey-2 flex flex-center row no-wrap q-pa-md gallery-dialog-main">
          <button class="icon-click" @click="prevDialogImage" style="margin-right: 15px">
            <img :src="arrowDownIcon" alt="arrowIcon" style="width: 12px" class="arrowIconLeft" />
          </button>

          <div
            class="bg-white flex flex-center relative-position"
            style="
              width: 90%;
              height: 90%;
              border-radius: 24px; /* กำหนดความโค้งที่กล่องขาวนี้แทน */
              overflow: hidden; /* ตัดส่วนเกินทิ้ง */
              border: 1px solid #cacaca;
            "
          >
            <q-img
              :src="images[dialogIndex]"
              fit="contain"
              style="height: max-content; width: 100%"
            >
              <template #error>
                <div class="img-fallback img-fallback--main">
                  <q-icon name="image_not_supported" size="40px" />
                  <div class="q-mt-sm">ไม่พบรูปภาพ</div>
                </div>
              </template>
            </q-img>
          </div>

          <button class="icon-click" @click="nextDialogImage" style="margin-left: 15px">
            <img :src="arrowDownIcon" alt="arrowIcon" style="width: 12px" class="arrowIconRight" />
          </button>
        </div>

        <div class="col-12 col-md-4 bg-white q-pa-lg scroll">
          <div class="text-h6 q-mb-lg">{{ name || 'อัลบั้มภาพสินค้า' }}</div>

          <div class="row q-col-gutter-sm">
            <div v-for="(img, idx) in images" :key="idx" class="col-4">
              <div
                class="dialog-thumbnail cursor-pointer"
                :class="{ 'dialog-active': dialogIndex === idx }"
                @click="dialogIndex = idx"
              >
                <q-img
                  :src="img"
                  ratio="1"
                  fit="contain"
                  class="rounded-borders"
                  style="border: 1px solid #cacaca; border-radius: 10px"
                >
                  <template #error>
                    <div class="img-fallback">
                      <q-icon name="image_not_supported" size="16px" />
                    </div>
                  </template>
                </q-img>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import arrowIcon from 'src/assets/icons/arrow.png';
import arrowDownIcon from 'src/assets/icons/arrow_down.png';

// รับ Props เป็น Array ของ URL รูปภาพ (String)
const props = defineProps<{
  images: string[];
  name: string;
}>();

const selectedIndex = ref(0);
const scrollIndex = ref(0); // ตัวแปรเก็บตำแหน่งเริ่มต้นของการโชว์รูป
const visibleCount = 4; // จำนวนรูปที่จะโชว์

// Computed: ตัดมาเฉพาะรูปที่จะโชว์ และแปะ index เดิมไปด้วย (เพื่อให้ highlight ถูกต้อง)
const visibleThumbnails = computed(() => {
  if (!props.images) return [];

  return props.images
    .map((img, index) => ({ img, originalIndex: index })) // เก็บ index เดิมไว้
    .slice(scrollIndex.value, scrollIndex.value + visibleCount); // ตัดเฉพาะส่วนที่จะโชว์
});

// คำนวณขอบเขตการเลื่อนลงสูงสุด
const maxScrollIndex = computed(() => {
  if (!props.images) return 0;
  return Math.max(0, props.images.length - visibleCount);
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

const dialogOpen = ref(false);
const dialogIndex = ref(0);
const openDialog = () => {
  dialogIndex.value = selectedIndex.value; // ซิงค์รูปปัจจุบันไปโชว์ใน popup
  dialogOpen.value = true;
};

const nextDialogImage = () => {
  if (dialogIndex.value < props.images.length - 1) {
    dialogIndex.value++;
  } else {
    dialogIndex.value = 0; // วนกลับรูปแรก
  }
};

const prevDialogImage = () => {
  if (dialogIndex.value > 0) {
    dialogIndex.value--;
  } else {
    dialogIndex.value = props.images.length - 1; // วนไปรูปสุดท้าย
  }
};
</script>

<style scoped>
.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  background: #f5f3ff;
  border: 1px solid #e9d8fd;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: all 0.15s ease;
}

.view-all-btn:hover {
  background: #ede9fe;
  border-color: #6d28d9;
}

.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
}

.img-fallback--main {
  font-size: 13px;
}

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

.gallery-layout {
  display: flex;
  gap: 16px;
}

.gallery-layout__main {
  flex: 1;
  min-width: 0;
}

.gallery-layout__rail {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.thumbnail-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.main-image-container {
  height: 500px; /* กรอบรูปใหญ่คงที่ ให้รูป cover เต็มกรอบพอดี */
  overflow: hidden;
}

@media (max-width: 600px) {
  .gallery-layout {
    flex-direction: column-reverse;
    gap: 10px;
  }

  .gallery-layout__rail {
    flex-direction: row;
    width: 100%;
    align-items: center;
  }

  .rail-arrow {
    display: none;
  }

  .thumbnail-strip {
    flex-direction: row;
    overflow-x: auto;
    flex: 1;
    min-width: 0;
    padding: 2px;
  }

  .thumbnail-card {
    flex: 0 0 auto;
  }

  .view-all-btn {
    flex: 0 0 auto;
  }

  .main-image-container {
    height: auto;
    aspect-ratio: 1 / 1;
    width: 100%;
  }

  .gallery-dialog-card {
    height: 92vh !important;
    max-width: 100vw !important;
    width: 100vw !important;
    border-radius: 0 !important;
  }

  .gallery-dialog-row {
    flex-direction: column;
    flex-wrap: nowrap;
    overflow-y: auto;
  }

  .gallery-dialog-main {
    flex: 0 0 auto;
    height: 45vh;
  }
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

.allImagesDialog {
  width: 500px;
  height: 300px;
}

.arrowIconLeft {
  transform: rotate(90deg);
  display: block;
}

.arrowIconRight {
  transform: rotate(-90deg);
  display: block;
}

.icon-click:active .arrowIconLeft {
  transform: rotate(90deg) scale(0.9); /* ถ้าอยากให้มี effect ยุบด้วย ให้ใส่ scale ต่อท้าย */
}

.icon-click:active .arrowIconRight {
  transform: rotate(-90deg) scale(0.9);
}
</style>
