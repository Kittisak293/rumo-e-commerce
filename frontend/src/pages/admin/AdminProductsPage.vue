<template>
  <q-page class="app-page">
    <!-- Header -->
    <div class="app-page__header">
      <div>
        <h1 class="app-page__title">จัดการสินค้า</h1>
        <div class="app-page__sub">แคตตาล็อกสินค้าทั้งร้าน</div>
      </div>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="app-toolbar">
      <div class="app-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="app-search__icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาชื่อสินค้า"
          class="app-search__input"
        />
      </div>

      <select v-model="selectedCategory" class="app-select">
        <option value="">ทุกหมวดหมู่</option>
        <option
          v-for="cat in categoryStore.categories"
          :key="cat.id"
          :value="String(cat.id)"
        >
          {{ cat.name }}
        </option>
      </select>

      <select v-model="sortBy" class="app-select">
        <option value="">เรียง: ค่าเริ่มต้น</option>
        <option value="price-asc">ราคา น้อย → มาก</option>
        <option value="price-desc">ราคา มาก → น้อย</option>
        <option value="stock-asc">สต็อก น้อย → มาก</option>
        <option value="stock-desc">สต็อก มาก → น้อย</option>
      </select>
    </div>

    <!-- Quick Filter Pills -->
    <div class="app-pills">
      <button
        type="button"
        class="app-pill"
        :class="{ 'app-pill--active': filterLowStock }"
        @click="filterLowStock = !filterLowStock"
      >
        สต็อกใกล้หมด
        <span class="app-pill__count">{{ lowStockCount }}</span>
      </button>
    </div>

    <div class="app-page__header">
      <!-- Filter Summary -->
        <div class="app-summary-text">{{ filterSummary }}</div>
        <button
          v-if="isFiltered"
          type="button"
          class="app-clear-btn"
          @click="clearFilters"
        >
          ล้างตัวกรองทั้งหมด ✕
        </button>
      <div class="app-header-right">
        <button type="button" class="app-add-btn" @click="openCreate">
          + เพิ่มสินค้า
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="store.loading" class="app-card">
      <div v-for="i in 5" :key="i" class="app-skel-row">
        <div class="app-skel-bar" style="width: 44px; height: 44px; border-radius: 10px; flex: none" />
        <div class="app-skel-bar" style="width: 220px; height: 14px" />
        <div class="app-skel-bar" style="width: 120px; height: 14px" />
        <div class="app-skel-bar" style="width: 80px; height: 14px" />
        <div class="app-skel-bar" style="width: 70px; height: 22px; border-radius: 999px" />
        <div class="app-skel-bar" style="width: 130px; height: 36px; border-radius: 14px; margin-left: auto" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="app-state-card">
      <div class="app-error-banner">
        <div class="app-error-banner__icon">!</div>
        <div>
          <div class="app-error-banner__title">โหลดรายการสินค้าไม่สำเร็จ</div>
          <div class="app-error-banner__sub">{{ store.error }}</div>
        </div>
      </div>
      <button type="button" class="app-cta-btn" @click="loadData">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- Empty State (No Products in Store) -->
    <div v-else-if="store.products.length === 0" class="app-state-card">
      <div class="app-state-icon app-state-icon--empty">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#6d28d9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7" cy="7" r="1.5" fill="#6d28d9"/>
        </svg>
      </div>
      <div class="app-state-title">ยังไม่มีสินค้าในระบบ</div>
      <div class="app-state-sub">เริ่มจากเพิ่มสินค้าชิ้นแรกเข้าแคตตาล็อก</div>
      <button type="button" class="app-add-btn" style="margin-top: 18px" @click="openCreate">
        + เพิ่มสินค้า
      </button>
    </div>

    <!-- Empty State (Filter No Match) -->
    <div v-else-if="filteredProducts.length === 0" class="app-state-card">
      <div class="app-state-icon app-state-icon--search">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div class="app-state-title">ไม่พบสินค้าที่ตรงกับตัวกรอง</div>
      <div class="app-state-sub">{{ filterSummary }}</div>
      <button type="button" class="app-add-btn" style="margin-top: 18px" @click="clearFilters">
        ล้างตัวกรองทั้งหมด
      </button>
    </div>

    <!-- Product Table -->
    <div v-else class="app-card">
      <table class="app-table">
        <thead>
          <tr>
            <th style="width: 40%">สินค้า</th>
            <th style="width: 18%">หมวดหมู่</th>
            <th style="width: 14%">ราคา</th>
            <th style="width: 13%">สต็อก</th>
            <th style="width: 15%"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id" class="app-row">
            <!-- Product Info -->
            <td class="app-td">
              <div class="app-prod-cell">
                <img
                  v-if="product.imageUrl"
                  :src="getImageUrl(product.imageUrl)"
                  :alt="product.name"
                  class="app-prod-img"
                  @error="onImgError"
                />
                <div v-else class="app-prod-img app-prod-img--placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9ca3af" stroke-width="1.5"/>
                    <circle cx="8.5" cy="9.5" r="1.5" fill="#9ca3af"/>
                    <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="app-prod-info">
                  <div class="app-prod-name" :title="product.name">{{ product.name }}</div>
                  <div v-if="product.storeType" class="app-prod-tag" :class="`app-prod-tag--${product.storeType}`">
                    {{ product.storeType === 'mall' ? 'Mall' : 'Seller' }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Category -->
            <td class="app-td">
              <span class="app-td-cat">{{ product.category?.name || '—' }}</span>
            </td>

            <!-- Price -->
            <td class="app-td">
              <span class="app-td-price">฿{{ Number(product.price).toLocaleString() }}</span>
            </td>

            <!-- Stock Chip -->
            <td class="app-td">
              <span v-if="product.stock === 0" class="app-chip app-chip--out">
                <span class="app-chip__dot" />หมด
              </span>
              <span v-else-if="product.stock <= 5" class="app-chip app-chip--low">
                <span class="app-chip__dot" />เหลือ {{ product.stock }}
              </span>
              <span v-else class="app-td-stock">
                {{ product.stock }}
              </span>
            </td>

            <!-- Actions -->
            <td class="app-td app-td--actions">
              <button type="button" class="app-btn-edit" @click="openEdit(product)">
                แก้ไข
              </button>
              <button type="button" class="app-btn-delete" @click="openDelete(product)">
                ลบ
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog: Add / Edit Product Modal -->
    <q-dialog v-model="formDialogOpen" persistent>
      <div class="app-form-modal">
        <!-- Modal Header -->
        <div class="app-form-header">
          <div class="app-form-title">{{ editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า' }}</div>
          <button type="button" class="app-modal-close" @click="closeFormDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#6b7280" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="app-form-body">
          <!-- Name -->
          <div class="app-field">
            <div class="app-label">ชื่อสินค้า <span class="app-req">*</span></div>
            <input
              v-model="form.name"
              type="text"
              placeholder="เช่น หูฟังไร้สาย TWS Pro"
              class="app-input"
              :class="{ 'app-input--error': formErrors.name }"
            />
            <div v-if="formErrors.name" class="app-field-error">{{ formErrors.name }}</div>
          </div>

          <!-- Description -->
          <div class="app-field">
            <div class="app-label">รายละเอียดสินค้า</div>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="อธิบายรายละเอียด คุณสมบัติสินค้าแบบข้อความล้วน"
              class="app-textarea"
            />
          </div>

          <!-- Price & Stock -->
          <div class="app-grid-2">
            <div class="app-field">
              <div class="app-label">ราคา (บาท) <span class="app-req">*</span></div>
              <div class="app-input-prefix-box" :class="{ 'app-input-prefix-box--error': formErrors.price }">
                <span class="app-input-prefix">฿</span>
                <input
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="app-input-inner"
                />
              </div>
              <div v-if="formErrors.price" class="app-field-error">{{ formErrors.price }}</div>
              <div v-else class="app-hint">จำนวนเต็มบาทเท่านั้น ไม่มีทศนิยม</div>
            </div>

            <div class="app-field">
              <div class="app-label">จำนวนในคลัง <span class="app-req">*</span></div>
              <input
                v-model.number="form.stock"
                type="number"
                min="0"
                placeholder="0"
                class="app-input"
                :class="{ 'app-input--error': formErrors.stock }"
              />
              <div v-if="formErrors.stock" class="app-field-error">{{ formErrors.stock }}</div>
            </div>
          </div>

          <!-- Category & Store Type -->
          <div class="app-grid-2">
            <div class="app-field">
              <div class="app-label">หมวดหมู่ <span class="app-req">*</span></div>
              <select
                v-model.number="form.categoryId"
                class="app-select-modal"
                :class="{ 'app-select-modal--error': formErrors.categoryId }"
              >
                <option value="0">เลือกหมวดหมู่</option>
                <option
                  v-for="cat in categoryStore.categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
              <div v-if="formErrors.categoryId" class="app-field-error">{{ formErrors.categoryId }}</div>
            </div>

            <div class="app-field">
              <div class="app-label">ประเภทร้าน</div>
              <div class="app-store-toggle">
                <button
                  type="button"
                  class="app-store-btn"
                  :class="{ 'app-store-btn--active': form.storeType === 'mall' }"
                  @click="form.storeType = 'mall'"
                >
                  Mall
                </button>
                <button
                  type="button"
                  class="app-store-btn"
                  :class="{ 'app-store-btn--active': form.storeType === 'seller' }"
                  @click="form.storeType = 'seller'"
                >
                  Seller
                </button>
              </div>
            </div>
          </div>

          <!-- Image Upload -->
          <div class="app-field">
            <div class="app-label">รูปสินค้า</div>
            <!-- Preview of Current or Selected Image -->
            <div v-if="imagePreviewUrl" class="app-img-preview-box">
              <img :src="imagePreviewUrl" alt="Product preview" class="app-img-preview" />
              <div class="app-img-preview-info">
                <div class="app-img-preview-name">{{ imageFileName || 'product-image.jpg' }}</div>
                <div class="app-img-preview-hint">รูปภาพเดี่ยวต่อสินค้า (Product.imageUrl)</div>
              </div>
              <button type="button" class="app-btn-change-img" @click="triggerFileInput">
                เปลี่ยนรูป
              </button>
            </div>

            <!-- Upload Dropzone / Button -->
            <div
              v-else
              class="app-dropzone"
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="onFileDrop"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="app-dropzone-icon">
                <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#9ca3af" stroke-width="1.8" />
                <path d="M3 16l4.5-4.5 3.5 3.5 3-3L21 17" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="8.5" cy="9.5" r="1.5" fill="#9ca3af" />
              </svg>
              <div class="app-dropzone-text">
                ลากรูปมาวาง หรือ <span class="app-dropzone-link">เลือกไฟล์</span>
              </div>
              <div class="app-dropzone-sub">JPG, PNG หรือ WebP · รูปเดียวต่อสินค้า</div>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="onFileChange"
            />
          </div>

          <!-- Action Error Banner -->
          <div v-if="store.actionError" class="app-action-error">
            {{ store.actionError }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="app-form-footer">
          <button
            type="button"
            class="app-btn-secondary"
            :disabled="store.actionLoading"
            @click="closeFormDialog"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            class="app-btn-primary"
            :disabled="store.actionLoading"
            @click="submitForm"
          >
            <span v-if="store.actionLoading" class="app-spinner" />
            <span>{{ store.actionLoading ? 'กำลังบันทึก...' : 'บันทึก' }}</span>
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Dialog: Delete Confirmation Modal -->
    <q-dialog v-model="deleteDialogOpen">
      <div class="app-delete-modal">
        <div class="app-delete-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5m0 4h.01" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" />
            <path d="M10.3 3.9L2.5 17.5A2 2 0 004.2 20.5h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="#dc2626" stroke-width="1.8" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="app-delete-title">ลบ “{{ targetProduct?.name }}” ?</div>
        <div class="app-delete-desc">
          สินค้าจะหายจากหน้าร้านทันที และหน้านี้ไม่มีทางกู้คืนกลับมา
        </div>
        <div class="app-delete-actions">
          <button
            type="button"
            class="app-btn-secondary"
            style="flex: 1"
            :disabled="store.actionLoading"
            @click="deleteDialogOpen = false"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            class="app-btn-danger"
            style="flex: 1"
            :disabled="store.actionLoading"
            @click="confirmDelete"
          >
            <span v-if="store.actionLoading" class="app-spinner" />
            <span>{{ store.actionLoading ? 'กำลังลบ...' : 'ลบสินค้า' }}</span>
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useProductStore } from 'src/stores/productStore';
import { useCategoryStore } from 'src/stores/categoryStore';
import type { Product } from 'src/models';
import { getImageUrl } from 'src/utils/imageUrl';

const store = useProductStore();
const categoryStore = useCategoryStore();

// --- Filter & Search State ---
const searchQuery = ref('');
const selectedCategory = ref('');
const sortBy = ref('');
const filterLowStock = ref(false);

function loadData() {
  void store.getProducts();
  void categoryStore.getCategories();
}

onMounted(loadData);

// Count of products with stock <= 5
const lowStockCount = computed(() => {
  return store.products.filter((p) => Number(p.stock) <= 5).length;
});

// Filtered & Sorted Products
const filteredProducts = computed(() => {
  let list = store.products.slice();

  // Search by name / description
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }

  // Category filter
  if (selectedCategory.value) {
    const catId = Number(selectedCategory.value);
    list = list.filter(
      (p) => p.categoryId === catId || p.category?.id === catId,
    );
  }

  // Low stock filter (0-5)
  if (filterLowStock.value) {
    list = list.filter((p) => Number(p.stock) <= 5);
  }

  // Sorting
  if (sortBy.value === 'price-asc') {
    list.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy.value === 'stock-asc') {
    list.sort((a, b) => Number(a.stock) - Number(b.stock));
  } else if (sortBy.value === 'stock-desc') {
    list.sort((a, b) => Number(b.stock) - Number(a.stock));
  }

  return list;
});

const isFiltered = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    selectedCategory.value !== '' ||
    filterLowStock.value ||
    sortBy.value !== ''
  );
});

const filterSummary = computed(() => {
  const parts: string[] = [];
  if (searchQuery.value.trim()) {
    parts.push(`คำค้น “${searchQuery.value.trim()}”`);
  }
  if (selectedCategory.value) {
    const cat = categoryStore.categories.find(
      (c) => c.id === Number(selectedCategory.value),
    );
    if (cat) parts.push(`หมวดหมู่ ${cat.name}`);
  }
  if (filterLowStock.value) {
    parts.push('เฉพาะสต็อกใกล้หมด (0–5)');
  }

  if (parts.length > 0) {
    return `กรองอยู่: ${parts.join(' · ')} — พบ ${filteredProducts.value.length} รายการ`;
  }
  return `แสดงทั้งหมด ${filteredProducts.value.length} รายการ`;
});

function clearFilters() {
  searchQuery.value = '';
  selectedCategory.value = '';
  sortBy.value = '';
  filterLowStock.value = false;
}

function onImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.src = '/static-images/unknown.jpg';
}

// --- Add / Edit Form State ---
const formDialogOpen = ref(false);
const editing = ref<Product | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const imageFileName = ref<string>('');

const form = reactive({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: 0,
  storeType: 'mall' as 'mall' | 'seller',
});

const formErrors = reactive({
  name: '',
  price: '',
  stock: '',
  categoryId: '',
});

function clearFormErrors() {
  formErrors.name = '';
  formErrors.price = '';
  formErrors.stock = '';
  formErrors.categoryId = '';
}

function openCreate() {
  editing.value = null;
  form.name = '';
  form.description = '';
  form.price = 0;
  form.stock = 0;
  form.categoryId = categoryStore.categories[0]?.id ?? 0;
  form.storeType = 'mall';
  selectedFile.value = null;
  imagePreviewUrl.value = null;
  imageFileName.value = '';
  clearFormErrors();
  store.clearActionError();
  formDialogOpen.value = true;
}

function openEdit(product: Product) {
  editing.value = product;
  form.name = product.name;
  form.description = product.description || '';
  form.price = Number(product.price);
  form.stock = Number(product.stock);
  form.categoryId = product.categoryId || product.category?.id || 0;
  form.storeType = product.storeType || 'mall';
  selectedFile.value = null;
  imagePreviewUrl.value = product.imageUrl ? getImageUrl(product.imageUrl) : null;
  imageFileName.value = product.imageUrl ? product.imageUrl.split('/').pop() || '' : '';
  clearFormErrors();
  store.clearActionError();
  formDialogOpen.value = true;
}

function closeFormDialog() {
  formDialogOpen.value = false;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    setUploadedFile(target.files[0]);
  }
}

function onFileDrop(e: DragEvent) {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    setUploadedFile(e.dataTransfer.files[0]);
  }
}

function setUploadedFile(file: File) {
  selectedFile.value = file;
  imageFileName.value = file.name;
  imagePreviewUrl.value = URL.createObjectURL(file);
}

function validateForm(): boolean {
  clearFormErrors();
  let valid = true;

  if (!form.name.trim()) {
    formErrors.name = 'กรุณาระบุชื่อสินค้า';
    valid = false;
  }
  if (form.price === null || form.price === undefined || form.price < 0) {
    formErrors.price = 'ราคาต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป';
    valid = false;
  }
  if (form.stock === null || form.stock === undefined || form.stock < 0) {
    formErrors.stock = 'จำนวนในคลังต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป';
    valid = false;
  }
  if (!form.categoryId || form.categoryId <= 0) {
    formErrors.categoryId = 'กรุณาเลือกหมวดหมู่สินค้า';
    valid = false;
  }

  return valid;
}

async function submitForm() {
  if (!validateForm()) return;

  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    categoryId: Number(form.categoryId),
    storeType: form.storeType,
  };

  let ok = false;
  if (editing.value) {
    ok = await store.updateProduct(editing.value.id, payload, selectedFile.value);
  } else {
    ok = await store.addProduct(payload, selectedFile.value);
  }

  if (ok) {
    formDialogOpen.value = false;
  }
}

// --- Delete Dialog State ---
const deleteDialogOpen = ref(false);
const targetProduct = ref<Product | null>(null);

function openDelete(product: Product) {
  targetProduct.value = product;
  deleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!targetProduct.value) return;
  const ok = await store.delProduct(targetProduct.value.id);
  if (ok) {
    deleteDialogOpen.value = false;
    targetProduct.value = null;
  }
}
</script>

<style scoped>
.app-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.app-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.app-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
  margin: 0;
  line-height: 1.3;
}

.app-page__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-header-count {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.app-count-num {
  font-weight: 600;
  color: #1d1d1d;
}

.app-add-btn {
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
  transition: background 0.15s ease;
}

.app-add-btn:hover {
  background: #5b21b6;
}

/* Toolbar & Filters */
.app-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.app-search {
  position: relative;
  flex: 1;
  max-width: 400px;
  min-width: 200px;
}

.app-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
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

.app-select {
  box-sizing: border-box;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
  min-width: 190px;
  cursor: pointer;
}

.app-select:focus {
  outline: none;
  border-color: #8e4dff;
  background: #fff;
}

/* Pills */
.app-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  align-items: center;
}

.app-pill {
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
}

.app-pill--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
}

.app-pill__count {
  margin-left: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 1px 7px;
  border-radius: 999px;
}

.app-pill--active .app-pill__count {
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
}

.app-summary-text {
  font-size: 12.5px;
  color: #6b7280;
}

.app-clear-btn {
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
  padding: 5px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
  transition: all 0.15s ease;
}

.app-clear-btn:hover {
  background: #f5f3ff;
}

/* Card & Table */
.app-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.app-table {
  width: 100%;
  border-collapse: collapse;
}

.app-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  padding: 0 10px 10px;
}

.app-row:hover {
  background: #fafafa;
}

.app-td {
  padding: 11px 10px;
  border-top: 1px solid #f3f4f6;
  font-size: 13.5px;
  color: #1d1d1d;
  vertical-align: middle;
}

.app-prod-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.app-prod-img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex: none;
  background: #f3f4f6;
}

.app-prod-img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-prod-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-prod-name {
  font-size: 13.5px;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.app-prod-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 999px;
  width: fit-content;
}

.app-prod-tag--mall {
  color: #6d28d9;
  background: #ede9fe;
}

.app-prod-tag--seller {
  color: #6b7280;
  background: #f3f4f6;
}

.app-td-cat {
  font-size: 13px;
  color: #6b7280;
}

.app-td-price {
  font-size: 13.5px;
  font-weight: 600;
  color: #6d28d9;
  white-space: nowrap;
}

.app-td-stock {
  font-size: 13.5px;
  color: #1d1d1d;
}

/* Stock Chips */
.app-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 13px;
  border-radius: 999px;
  white-space: nowrap;
}

.app-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.app-chip--out {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.app-chip--out .app-chip__dot {
  background: #dc2626;
}

.app-chip--low {
  color: #c2410c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.app-chip--low .app-chip__dot {
  background: #c2410c;
}

.app-td--actions {
  text-align: right;
  white-space: nowrap;
}

.app-btn-edit {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
  margin-right: 8px;
  transition: background 0.15s ease;
}

.app-btn-edit:hover {
  background: #f5f3ff;
}

.app-btn-delete {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  transition: background 0.15s ease;
}

.app-btn-delete:hover {
  background: #fee2e2;
}

/* State Cards */
.app-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
  max-width: 460px;
  margin: 20px auto 0;
}

.app-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.app-state-icon--empty {
  background: #ede9fe;
}

.app-state-icon--search {
  background: #f3f4f6;
}

.app-state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.app-state-sub {
  font-size: 13.5px;
  color: #6b7280;
}

.app-error-banner {
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

.app-error-banner__icon {
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

.app-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.app-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.app-cta-btn {
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

/* Skeleton Loading */
.app-skel-row {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
}

.app-skel-row:first-child {
  border-top: none;
}

.app-skel-bar {
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: ash-shimmer 1.4s ease infinite;
}

@keyframes ash-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* Form Dialog Modal */
.app-form-modal {
  width: 560px;
  max-width: 94vw;
  background: #fff;
  border-radius: 18px;
  box-sizing: border-box;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-form-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}

.app-form-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
}

.app-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.app-form-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.app-field {
  display: flex;
  flex-direction: column;
}

.app-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.app-req {
  color: #dc2626;
}

.app-input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
}

.app-input:focus {
  outline: none;
  border-color: #8e4dff;
  background: #fff;
}

.app-input--error {
  border-color: #fecaca;
  background: #fef2f2;
}

.app-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
  resize: vertical;
}

.app-textarea:focus {
  outline: none;
  border-color: #8e4dff;
  background: #fff;
}

.app-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.app-input-prefix-box {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  background: #fafafa;
}

.app-input-prefix-box:focus-within {
  border-color: #8e4dff;
  background: #fff;
}

.app-input-prefix-box--error {
  border-color: #fecaca;
  background: #fef2f2;
}

.app-input-prefix {
  padding-left: 14px;
  font-size: 13.5px;
  color: #9ca3af;
  pointer-events: none;
}

.app-input-inner {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px 11px 8px;
  border: none;
  background: transparent;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
}

.app-input-inner:focus {
  outline: none;
}

.app-hint {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 5px;
}

.app-field-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 5px;
}

.app-select-modal {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
  cursor: pointer;
}

.app-select-modal:focus {
  outline: none;
  border-color: #8e4dff;
  background: #fff;
}

.app-select-modal--error {
  border-color: #fecaca;
  background: #fef2f2;
}

.app-store-toggle {
  display: flex;
  gap: 8px;
}

.app-store-btn {
  flex: 1;
  padding: 11px 8px;
  border-radius: 14px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  background: #fff;
  border: 1.5px solid #e5e7eb;
}

.app-store-btn--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
}

/* Image Upload UI */
.app-img-preview-box {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  background: #fafafa;
}

.app-img-preview {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  flex: none;
  background: #e5e7eb;
}

.app-img-preview-info {
  flex: 1;
  min-width: 0;
}

.app-img-preview-name {
  font-size: 13.5px;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-img-preview-hint {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 2px;
}

.app-btn-change-img {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
  white-space: nowrap;
}

.app-btn-change-img:hover {
  background: #f5f3ff;
}

.app-dropzone {
  border: 1.5px dashed #e5e7eb;
  border-radius: 14px;
  padding: 26px 16px;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-dropzone:hover {
  border-color: #8e4dff;
  background: #f5f3ff;
}

.app-dropzone-icon {
  margin-bottom: 8px;
}

.app-dropzone-text {
  font-size: 13.5px;
  color: #6b7280;
}

.app-dropzone-link {
  color: #6d28d9;
  font-weight: 600;
}

.app-dropzone-sub {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 4px;
}

.app-action-error {
  font-size: 12.5px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 12px;
}

.app-form-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fff;
}

.app-btn-secondary {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.app-btn-primary {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.app-btn-primary:hover {
  background: #5b21b6;
}

.app-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  display: inline-block;
  animation: ap-spin 0.8s linear infinite;
}

@keyframes ap-spin {
  to { transform: rotate(360deg); }
}

/* Delete Modal */
.app-delete-modal {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  padding: 28px 24px;
  text-align: center;
}

.app-delete-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.app-delete-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 8px;
  word-break: break-word;
}

.app-delete-desc {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 20px;
}

.app-delete-actions {
  display: flex;
  gap: 10px;
}

.app-btn-danger {
  font-family: inherit;
  box-sizing: border-box;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  color: #fff;
  background: #dc2626;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.app-btn-danger:hover {
  background: #b91c1c;
}

.app-btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 860px) {
  .app-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .app-card {
    overflow-x: auto;
  }

  .app-table {
    min-width: 720px;
  }

  .app-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
