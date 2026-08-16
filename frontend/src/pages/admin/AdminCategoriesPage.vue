<template>
  <q-page class="acg-page">
    <div class="acg-header">
      <div>
        <div class="acg-header__title">จัดการหมวดหมู่</div>
        <div class="app-page__sub">หมวดหมู่สินค้าทั้งร้าน</div>
      </div>
    </div>
    <div class="acg-toolbar">
      <div class="acg-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="acg-search__icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อหมวดหมู่" class="acg-search__input" />
      </div>
      <div class="acg-toolbar__row">
        <div class="acg-header__sub">แสดงทั้งหมด {{ filteredCategories.length }} หมวด</div>
        <button type="button" class="acg-add-btn" @click="openCreate">+ เพิ่มหมวดหมู่</button>
      </div>
    </div>

    

    <div v-if="productStore.error" class="acg-warn-banner">
      <div class="acg-warn-banner__icon">!</div>
      <div>โหลดจำนวนสินค้าต่อหมวดไม่สำเร็จ — ปิดปุ่มลบไว้ชั่วคราวเพื่อความปลอดภัย ({{ productStore.error }})</div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="acg-grid">
      <div v-for="i in 8" :key="i" class="acg-skel-card">
        <div class="acg-skel-bar" style="width: 100%; aspect-ratio: 4 / 3; border-radius: 18px 18px 0 0" />
        <div class="acg-skel-card__body">
          <div class="acg-skel-bar" style="width: 70%; height: 16px" />
          <div class="acg-skel-bar" style="width: 40%; height: 14px; margin-top: 8px" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="acg-state-card">
      <div class="acg-error-banner">
        <div class="acg-error-banner__icon">!</div>
        <div>
          <div class="acg-error-banner__title">โหลดหมวดหมู่ไม่สำเร็จ</div>
          <div class="acg-error-banner__sub">{{ store.error }}</div>
        </div>
      </div>
      <button type="button" class="acg-cta" @click="load">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- No categories at all -->
    <div v-else-if="store.categories.length === 0" class="acg-state-card">
      <div class="acg-state-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="17" cy="17" r="3" stroke="#9ca3af" stroke-width="1.8" />
        </svg>
      </div>
      <div class="acg-state-title">ยังไม่มีหมวดหมู่ในระบบ</div>
      <div class="acg-state-sub">เพิ่มหมวดหมู่แรกเพื่อเริ่มจัดสินค้าเข้าหมวด</div>
      <button type="button" class="acg-cta" style="max-width: 220px; margin: 16px auto 0" @click="openCreate">
        + เพิ่มหมวดหมู่
      </button>
    </div>

    <!-- No search results -->
    <div v-else-if="filteredCategories.length === 0" class="acg-state-card">
      <div class="acg-state-icon acg-state-icon--muted">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div class="acg-state-title">ไม่พบหมวดหมู่ที่ตรงกับคำค้น</div>
      <div class="acg-state-sub">ลองค้นหาด้วยคำอื่น</div>
      <button type="button" class="acg-clear-btn" style="margin: 16px auto 0" @click="searchQuery = ''">ล้างคำค้นหา</button>
    </div>

    <!-- Grid -->
    <div v-else class="acg-grid">
      <div v-for="cat in filteredCategories" :key="cat.id" class="acg-card">
        <div class="acg-card__img-wrap">
          <img v-if="!isUnknownImage(cat.imageUrl)" :src="getImageUrl(cat.imageUrl)" :alt="cat.name" class="acg-card__img" />
          <div v-else class="acg-card__img-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9ca3af" stroke-width="1.6" />
              <circle cx="8.5" cy="10" r="1.5" stroke="#9ca3af" stroke-width="1.6" />
              <path d="M21 15l-5-4-6 5" stroke="#9ca3af" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>ยังไม่ได้ใส่รูป</span>
          </div>
        </div>
        <div class="acg-card__body">
          <div class="acg-card__name">{{ cat.name }}</div>
          <span class="acg-chip" :class="{ 'acg-chip--empty': productCount(cat.id) === 0 }">
            {{ productCount(cat.id) }} สินค้า
          </span>
          <div class="acg-card__actions">
            <button type="button" class="acg-btn acg-btn--secondary" @click="openEdit(cat)">แก้ไข</button>
            <button
              type="button"
              class="acg-btn acg-btn--danger"
              :disabled="!!productStore.error"
              @click="openDelete(cat)"
            >
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit dialog -->
    <q-dialog v-model="formOpen">
      <div class="acg-form-card">
        <div class="acg-form-header">
          <div class="acg-form-title">{{ editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่' }}</div>
          <button type="button" class="acg-close-btn" aria-label="ปิด" @click="formOpen = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="acg-label">ชื่อหมวดหมู่</div>
        <q-input v-model="form.name" dense outlined placeholder="เช่น เสื้อผ้าแฟชั่น" class="acg-input" />
        <div v-if="store.actionError" class="acg-field-error">{{ store.actionError }}</div>

        <template v-if="editing">
          <div class="acg-label acg-label--spaced">ลิงก์หมวดหมู่ (slug)</div>
          <div class="acg-slug-readonly">{{ editing.slug }}</div>
          <div class="acg-hint">ลิงก์เดิมจะไม่เปลี่ยนตามชื่อใหม่ — สร้างจากชื่อตอนสร้างหมวดครั้งแรกเท่านั้น</div>
        </template>

        <div class="acg-label acg-label--spaced">รูปหมวดหมู่</div>
        <div
          class="acg-dropzone"
          :class="{ 'acg-dropzone--drag': isDragOver, 'acg-dropzone--uploading': store.actionLoading }"
          @click="triggerFilePick"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDrop"
        >
          <input ref="fileInput" type="file" accept="image/*" class="acg-dropzone__input" @change="onFileChange" />

          <template v-if="store.actionLoading">
            <div class="acg-dropzone__spinner" />
            <div class="acg-dropzone__text">กำลังอัปโหลด...</div>
          </template>
          <template v-else-if="previewSrc">
            <img :src="previewSrc" alt="พรีวิวรูปหมวดหมู่" class="acg-dropzone__preview" />
            <button type="button" class="acg-dropzone__change-btn" @click.stop="triggerFilePick">เปลี่ยนรูป</button>
          </template>
          <template v-else>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <div class="acg-dropzone__text">ลากรูปมาวาง หรือคลิกเพื่อเลือกไฟล์</div>
          </template>
        </div>
        <div v-if="editing && !selectedFile" class="acg-hint">ไม่เลือกไฟล์ใหม่ = ใช้รูปเดิมต่อ ไม่ถูกแตะต้อง</div>

        <div class="acg-form-actions">
          <button type="button" class="acg-btn acg-btn--secondary" @click="formOpen = false">ยกเลิก</button>
          <button
            type="button"
            class="acg-btn acg-btn--primary"
            :disabled="!canSave || store.actionLoading"
            @click="save"
          >
            <span v-if="store.actionLoading" class="acg-btn__spinner" />
            {{ store.actionLoading ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Delete confirm: empty category -->
    <q-dialog v-model="deleteEmptyOpen">
      <div class="acg-confirm-card">
        <div class="acg-confirm-icon acg-confirm-icon--danger">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0v13a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="acg-confirm-title">ยืนยันลบหมวดหมู่</div>
        <div class="acg-confirm-desc">
          หมวด “<b>{{ deleteTarget?.name }}</b>” ไม่มีสินค้าอยู่ ลบแล้วจะหายจากหน้าร้านทันทีและกู้คืนไม่ได้
        </div>
        <div v-if="store.actionError" class="acg-field-error" style="text-align: left; margin-bottom: 12px">{{ store.actionError }}</div>
        <div class="acg-confirm-actions">
          <button type="button" class="acg-btn acg-btn--secondary" style="flex: 1" @click="deleteEmptyOpen = false">ยกเลิก</button>
          <button type="button" class="acg-btn acg-btn--danger-solid" style="flex: 1" :disabled="store.actionLoading" @click="confirmDelete">
            {{ store.actionLoading ? 'กำลังลบ...' : 'ลบหมวดหมู่' }}
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Delete confirm: category has products -->
    <q-dialog v-model="deleteWithProductsOpen">
      <div class="acg-confirm-card">
        <div class="acg-confirm-icon acg-confirm-icon--warn">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004 21h16a2 2 0 001.89-2.96L13.71 3.86a2 2 0 00-3.42 0z" stroke="#c2410c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="acg-confirm-title">หมวดหมู่นี้มีสินค้าอยู่</div>
        <div class="acg-confirm-desc">
          หมวด “<b>{{ deleteTarget?.name }}</b>” มีสินค้าอยู่ <b>{{ deleteTarget ? productCount(deleteTarget.id) : 0 }} ชิ้น</b>
          ถ้าลบหมวดนี้ หมวดจะหายจากหน้าร้านทันทีและกู้คืนไม่ได้ ส่วนสินค้าทั้งหมดจะ<b>ไม่ถูกลบไปด้วย</b>
          แต่จะกลายเป็นสินค้าที่ไม่มีหมวดหมู่
        </div>
        <router-link :to="{ name: 'adminProducts' }" class="acg-manage-link" @click="deleteWithProductsOpen = false">
          ไปจัดการสินค้าในหมวดนี้ก่อน →
        </router-link>
        <label class="acg-confirm-checkbox">
          <input v-model="acknowledgeImpact" type="checkbox" />
          ฉันเข้าใจว่าสินค้า {{ deleteTarget ? productCount(deleteTarget.id) : 0 }} ชิ้นจะกลายเป็นสินค้าไร้หมวด และต้องการลบต่อ
        </label>
        <div v-if="store.actionError" class="acg-field-error" style="text-align: left; margin-bottom: 12px">{{ store.actionError }}</div>
        <div class="acg-confirm-actions">
          <button type="button" class="acg-btn acg-btn--secondary" style="flex: 1" @click="deleteWithProductsOpen = false">ยกเลิก</button>
          <button
            type="button"
            class="acg-btn acg-btn--danger-solid"
            style="flex: 1"
            :disabled="!acknowledgeImpact || store.actionLoading"
            @click="confirmDelete"
          >
            {{ store.actionLoading ? 'กำลังลบ...' : 'ลบหมวดหมู่' }}
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useCategoryStore } from 'src/stores/categoryStore';
import { useProductStore } from 'src/stores/productStore';
import type { Category } from 'src/models';
import { getImageUrl } from 'src/utils/imageUrl';

const store = useCategoryStore();
const productStore = useProductStore();

function load() {
  void store.getCategories();
  void productStore.getProducts();
}

onMounted(load);

const searchQuery = ref('');
const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return store.categories;
  return store.categories.filter((c) => c.name.toLowerCase().includes(q));
});

function isUnknownImage(imageUrl: string): boolean {
  return !imageUrl || imageUrl.endsWith('unknown.jpg');
}

const productCounts = computed(() => {
  const counts = new Map<number, number>();
  for (const p of productStore.products) {
    counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
  }
  return counts;
});
function productCount(categoryId: number): number {
  return productCounts.value.get(categoryId) ?? 0;
}

// ---- Add / edit form ----

const formOpen = ref(false);
const editing = ref<Category | null>(null);
const form = ref({ name: '' });
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const objectUrl = ref<string | null>(null);
const isDragOver = ref(false);

const previewSrc = computed(() => {
  if (objectUrl.value) return objectUrl.value;
  if (editing.value && !isUnknownImage(editing.value.imageUrl)) return getImageUrl(editing.value.imageUrl);
  return null;
});

function resetForm() {
  form.value.name = '';
  selectedFile.value = null;
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = null;
  isDragOver.value = false;
  store.clearActionError();
}

function openCreate() {
  editing.value = null;
  resetForm();
  formOpen.value = true;
}

function openEdit(cat: Category) {
  editing.value = cat;
  resetForm();
  form.value.name = cat.name;
  formOpen.value = true;
}

function triggerFilePick() {
  if (store.actionLoading) return;
  fileInput.value?.click();
}

function setFile(file: File | null) {
  if (!file) return;
  selectedFile.value = file;
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = URL.createObjectURL(file);
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  setFile(target.files?.[0] ?? null);
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  setFile(e.dataTransfer?.files?.[0] ?? null);
}

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
});

const canSave = computed(() => form.value.name.trim().length > 0);

async function save() {
  if (!canSave.value) return;
  const name = form.value.name.trim();
  const ok = editing.value
    ? await store.updateCategory(editing.value.id, name, selectedFile.value)
    : await store.addCategory(name, selectedFile.value);
  if (ok) formOpen.value = false;
}

// ---- Delete ----

const deleteTarget = ref<Category | null>(null);
const deleteEmptyOpen = ref(false);
const deleteWithProductsOpen = ref(false);
const acknowledgeImpact = ref(false);

function openDelete(cat: Category) {
  deleteTarget.value = cat;
  store.clearActionError();
  acknowledgeImpact.value = false;
  if (productCount(cat.id) === 0) {
    deleteEmptyOpen.value = true;
  } else {
    deleteWithProductsOpen.value = true;
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  const ok = await store.delCategory(deleteTarget.value.id);
  if (ok) {
    deleteEmptyOpen.value = false;
    deleteWithProductsOpen.value = false;
    deleteTarget.value = null;
  }
}
</script>

<style scoped>
.acg-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.acg-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.acg-header__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.acg-header__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.acg-add-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border: none;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  cursor: pointer;
  white-space: nowrap;
}

.acg-toolbar {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.acg-toolbar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.acg-header__sub {
  white-space: nowrap;
}

.acg-search {
  position: relative;
  max-width: 400px;
  width: 100%;
}

.acg-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.acg-search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px 11px 40px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
}

.acg-search__input:focus {
  outline: none;
  border-color: #8e4dff;
}

.acg-warn-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 12.5px;
  color: #c2410c;
}

.acg-warn-banner__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #c2410c;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.acg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
}

.acg-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-sizing: border-box;
}

.acg-card__img-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f3f4f6;
}

.acg-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.acg-card__img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.acg-card__body {
  padding: 14px;
}

.acg-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.acg-chip {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 0 10px;
  height: 24px;
  line-height: 24px;
}

.acg-chip--empty {
  color: #9ca3af;
  background: #f9fafb;
}

.acg-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.acg-btn {
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 14px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 9px 14px;
}

.acg-card__actions .acg-btn {
  flex: 1;
}

.acg-btn--secondary {
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
}

.acg-btn--danger {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.acg-btn--danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.acg-btn--danger-solid {
  color: #fff;
  background: #dc2626;
  border: none;
}

.acg-btn--danger-solid:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.acg-btn--primary {
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.acg-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.acg-btn__spinner {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: acg-spin 0.7s linear infinite;
}

@keyframes acg-spin {
  to {
    transform: rotate(360deg);
  }
}

.acg-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
  max-width: 460px;
  margin: 20px auto 0;
}

.acg-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.acg-state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.acg-state-sub {
  font-size: 13.5px;
  color: #6b7280;
}

.acg-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
}

.acg-error-banner__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.acg-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.acg-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.acg-cta {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  font-family: inherit;
  box-sizing: border-box;
}

.acg-clear-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
}

.acg-skel-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.acg-skel-card__body {
  padding: 14px;
}

.acg-skel-bar {
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: acg-shimmer 1.4s ease infinite;
}

@keyframes acg-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* Form dialog */

.acg-form-card {
  width: 480px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-sizing: border-box;
}

.acg-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.acg-form-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
}

.acg-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.acg-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 7px;
}

.acg-label--spaced {
  margin-top: 16px;
}

.acg-input :deep(.q-field__control) {
  border-radius: 14px;
}

.acg-field-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
}

.acg-slug-readonly {
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #f3f4f6;
  font-size: 13px;
  color: #6b7280;
  font-family: ui-monospace, Menlo, monospace;
}

.acg-hint {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 6px;
}

.acg-dropzone {
  position: relative;
  border: 1.5px dashed #e5e7eb;
  border-radius: 14px;
  background: #fafafa;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-sizing: border-box;
  padding: 16px;
  text-align: center;
}

.acg-dropzone--drag {
  border-color: #8e4dff;
  background: #f5f3ff;
}

.acg-dropzone--uploading {
  cursor: not-allowed;
}

.acg-dropzone__input {
  display: none;
}

.acg-dropzone__text {
  font-size: 12.5px;
  color: #9ca3af;
}

.acg-dropzone__preview {
  max-width: 100%;
  max-height: 140px;
  border-radius: 10px;
  object-fit: cover;
}

.acg-dropzone__change-btn {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
  border-radius: 999px;
  padding: 6px 14px;
  cursor: pointer;
}

.acg-dropzone__spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid #ddd6fe;
  border-top-color: #6d28d9;
  animation: acg-spin 0.7s linear infinite;
}

.acg-form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

/* Delete confirm dialogs */

.acg-confirm-card {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  padding: 28px 24px;
  text-align: center;
}

.acg-confirm-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.acg-confirm-icon--danger {
  background: #fef2f2;
}

.acg-confirm-icon--warn {
  background: #fff7ed;
}

.acg-confirm-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 8px;
}

.acg-confirm-desc {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 14px;
  text-align: left;
}

.acg-manage-link {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #6d28d9;
  text-decoration: none;
  margin-bottom: 14px;
  text-align: left;
}

.acg-confirm-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: #1d1d1d;
  text-align: left;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 16px;
  cursor: pointer;
}

.acg-confirm-checkbox input {
  margin-top: 2px;
  flex-shrink: 0;
}

.acg-confirm-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 860px) {
  .acg-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .acg-grid {
    grid-template-columns: 1fr;
  }

  .acg-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .acg-add-btn {
    width: 100%;
  }
}

.app-page__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.app-search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px 11px 40px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
}

.app-search__input:focus {
  outline: none;
  border-color: #8e4dff;
  background: #fff;
}

</style>
