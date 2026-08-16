<template>
  <q-page class="acp-page">
    <div class="acp-page__header">
      <div>
        <div class="acp-page__title">บริษัทขนส่ง</div>
        <div class="acp-page__sub">ตัวเลือกที่แอดมินเลือกได้ตอนสร้างพัสดุ</div>
      </div>
    </div>

    <div v-if="store.error" class="acp-error-banner">
      <div class="acp-error-banner__icon">!</div>
      <div>{{ store.error }}</div>
    </div>

    <div class="acp-toolbar">
      <div class="acp-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="acp-search__icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาชื่อบริษัทขนส่งหรือ code"
          class="acp-search__input"
        />
      </div>
    </div>

    <div class="acp-page__header">
      <div class="acp-summary-text">{{ filterSummary }}</div>
      <div class="acp-header-right">
        <button type="button" class="acp-add-btn" @click="openCreate">+ เพิ่มบริษัทขนส่ง</button>
      </div>
    </div>

    <div v-if="store.carriers.length === 0" class="acp-state-card">
      <div class="acp-state-title">ยังไม่มีบริษัทขนส่ง</div>
      <div class="acp-state-sub">เพิ่มบริษัทขนส่งแรกเพื่อเริ่มสร้างพัสดุ</div>
    </div>

    <div v-else-if="filteredCarriers.length === 0" class="acp-state-card">
      <div class="acp-state-title">ไม่พบบริษัทขนส่งที่ตรงกับคำค้น</div>
      <div class="acp-state-sub">ลองค้นหาด้วยคำอื่น</div>
    </div>

    <div v-else class="acp-card">
      <table class="acp-table">
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>code</th>
            <th>ลิงก์ติดตามที่ลูกค้าจะได้</th>
            <th>ใช้งาน</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="carrier in filteredCarriers" :key="carrier.id" class="acp-row">
            <td class="acp-td">
              <div class="acp-carrier">
                <span class="acp-avatar" :class="{ 'acp-avatar--inactive': !carrier.isActive }">{{ initials(carrier.name) }}</span>
                <div>
                  <div class="acp-carrier__name">{{ carrier.name }}</div>
                  <div class="acp-carrier__website">{{ carrier.website ?? '—' }}</div>
                </div>
              </div>
            </td>
            <td class="acp-td acp-td--mono">{{ carrier.code }}</td>
            <td class="acp-td">
              <template v-if="carrier.trackingUrlTemplate">
                <div v-if="preview(carrier.trackingUrlTemplate)" class="acp-preview-ok">
                  {{ preview(carrier.trackingUrlTemplate) }}
                </div>
                <div v-else class="acp-preview-bad">! placeholder ไม่ถูกต้อง — ลิงก์ในอีเมลจะพัง</div>
              </template>
              <span v-else class="acp-td--muted">ยังไม่ตั้งค่า</span>
            </td>
            <td class="acp-td">
              <button
                type="button"
                class="acp-switch"
                :class="{ 'acp-switch--on': carrier.isActive }"
                @click="toggleActive(carrier)"
              >
                <span class="acp-switch__knob" />
              </button>
            </td>
            <td class="acp-td acp-td--action">
              <button type="button" class="acp-row-btn" @click="openEdit(carrier)">แก้ไข</button>
              <button type="button" class="acp-row-btn acp-row-btn--danger" @click="remove(carrier)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <q-dialog v-model="dialogOpen">
      <div class="acp-form-card">
        <div class="acp-form-title">{{ editing ? 'แก้ไขบริษัทขนส่ง' : 'เพิ่มบริษัทขนส่ง' }}</div>
        <div class="acp-form-sub">code ต้องไม่ซ้ำกับที่มีอยู่</div>

        <div class="acp-form-row">
          <div class="acp-form-field">
            <div class="acp-label">ชื่อ</div>
            <q-input v-model="form.name" dense outlined placeholder="เช่น Ninja Van" />
          </div>
          <div class="acp-form-field acp-form-field--narrow">
            <div class="acp-label">code</div>
            <q-input v-model="form.code" dense outlined placeholder="เช่น NINJA" />
          </div>
        </div>

        <div class="acp-label">เว็บไซต์ <span class="acp-optional">(ไม่บังคับ)</span></div>
        <q-input v-model="form.website" dense outlined placeholder="https://..." class="q-mb-md" />

        <div class="acp-template-head">
          <div class="acp-label">tracking URL template</div>
          <button type="button" class="acp-chip" @click="insertPlaceholder">+ {trackingNumber}</button>
        </div>
        <q-input
          v-model="form.trackingUrlTemplate"
          dense
          outlined
          placeholder="https://track.example.com/?code={trackingNumber}"
        />

        <div class="acp-template-preview" :class="{ 'acp-template-preview--bad': form.trackingUrlTemplate && !previewLink }">
          <template v-if="!form.trackingUrlTemplate">
            <div class="acp-template-preview__hint">ใส่ {trackingNumber} แทนตำแหน่งที่จะแทรกเลขพัสดุ</div>
          </template>
          <template v-else-if="previewLink">
            <div class="acp-template-preview__label">ลิงก์ที่ลูกค้าจะได้ในอีเมล (ลองด้วยเลขตัวอย่าง {{ SAMPLE }})</div>
            <div class="acp-template-preview__link">{{ previewLink }}</div>
            <div class="acp-template-preview__ok">✓ เลขพัสดุถูกแทนที่เรียบร้อย</div>
          </template>
          <template v-else>
            <div class="acp-template-preview__bad-text">
              ! ไม่พบ <code>{trackingNumber}</code> ในข้อความ — ลิงก์ในอีเมลลูกค้าจะพังเงียบ ๆ
            </div>
          </template>
        </div>

        <div v-if="store.actionError" class="acp-error">{{ store.actionError }}</div>

        <div class="acp-form-actions">
          <button type="button" class="acp-btn acp-btn--secondary" @click="dialogOpen = false">ยกเลิก</button>
          <button type="button" class="acp-btn acp-btn--primary" :disabled="!canSave || store.actionLoading" @click="save">
            {{ store.actionLoading ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useAdminShipmentStore } from 'src/stores/adminShipmentStore';
import type { CarrierData } from 'src/stores/orderStore';
import { previewTrackingUrl, SAMPLE_TRACKING_NUMBER, TRACKING_NUMBER_PLACEHOLDER } from 'src/utils/trackingUrl';

const store = useAdminShipmentStore();
const SAMPLE = SAMPLE_TRACKING_NUMBER;

onMounted(() => void store.fetchCarriers());

const searchQuery = ref('');

const filteredCarriers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return store.carriers;
  return store.carriers.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
  );
});

const filterSummary = computed(() => {
  const q = searchQuery.value.trim();
  if (q) {
    return `กรองอยู่: คำค้น “${q}” — พบ ${filteredCarriers.value.length} รายการ`;
  }
  return `แสดงทั้งหมด ${filteredCarriers.value.length} รายการ`;
});

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function preview(template: string): string | null {
  return previewTrackingUrl(template, SAMPLE_TRACKING_NUMBER);
}

async function toggleActive(carrier: CarrierData) {
  await store.updateCarrier(carrier.id, { isActive: !carrier.isActive });
}

async function remove(carrier: CarrierData) {
  if (!window.confirm(`ลบขนส่ง "${carrier.name}" ใช่หรือไม่?`)) return;
  await store.removeCarrier(carrier.id);
}

const dialogOpen = ref(false);
const editing = ref<CarrierData | null>(null);
const form = reactive({ name: '', code: '', website: '', trackingUrlTemplate: '' });

function resetForm() {
  form.name = '';
  form.code = '';
  form.website = '';
  form.trackingUrlTemplate = '';
  store.clearActionError();
}

function openCreate() {
  editing.value = null;
  resetForm();
  dialogOpen.value = true;
}

function openEdit(carrier: CarrierData) {
  editing.value = carrier;
  form.name = carrier.name;
  form.code = carrier.code;
  form.website = carrier.website ?? '';
  form.trackingUrlTemplate = carrier.trackingUrlTemplate ?? '';
  store.clearActionError();
  dialogOpen.value = true;
}

function insertPlaceholder() {
  form.trackingUrlTemplate += TRACKING_NUMBER_PLACEHOLDER;
}

const previewLink = computed(() =>
  form.trackingUrlTemplate ? previewTrackingUrl(form.trackingUrlTemplate, SAMPLE_TRACKING_NUMBER) : null,
);

const canSave = computed(() => form.name.trim().length > 0 && form.code.trim().length > 0);

async function save() {
  if (!canSave.value) return;
  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
    ...(form.website.trim() ? { website: form.website.trim() } : {}),
    ...(form.trackingUrlTemplate.trim() ? { trackingUrlTemplate: form.trackingUrlTemplate.trim() } : {}),
  };
  const ok = editing.value
    ? await store.updateCarrier(editing.value.id, payload)
    : await store.createCarrier(payload);
  if (ok) dialogOpen.value = false;
}
</script>

<style scoped>
.acp-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.acp-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.acp-summary-text {
  font-size: 12.5px;
  color: #6b7280;
}

.acp-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.acp-page__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.acp-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.acp-search {
  position: relative;
  flex: 1;
  max-width: 400px;
  min-width: 200px;
}

.acp-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.acp-search__input {
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

.acp-search__input:focus {
  outline: none;
  border-color: #8e4dff;
  background: #fff;
}

.acp-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.acp-add-btn {
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

.acp-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.acp-table {
  width: 100%;
  border-collapse: collapse;
}

.acp-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  padding: 0 10px 10px;
}

.acp-row:hover {
  background: #fafafa;
}

.acp-td {
  padding: 14px 10px;
  border-top: 1px solid #f3f4f6;
  font-size: 13.5px;
  color: #1d1d1d;
  vertical-align: middle;
}

.acp-td--mono {
  font-size: 12.5px;
  font-family: ui-monospace, Menlo, monospace;
  color: #6b7280;
}

.acp-td--muted {
  font-size: 12.5px;
  color: #9ca3af;
}

.acp-td--action {
  text-align: right;
  white-space: nowrap;
}

.acp-carrier {
  display: flex;
  align-items: center;
  gap: 10px;
}

.acp-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.acp-avatar--inactive {
  background: #f3f4f6;
  color: #9ca3af;
}

.acp-carrier__name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1d1d1d;
}

.acp-carrier__website {
  font-size: 11.5px;
  color: #9ca3af;
}

.acp-preview-ok {
  font-size: 12px;
  font-family: ui-monospace, Menlo, monospace;
  color: #8e4dff;
  word-break: break-all;
}

.acp-preview-bad {
  font-size: 11.5px;
  font-weight: 600;
  color: #dc2626;
}

.acp-switch {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #e5e7eb;
  border: none;
  display: flex;
  align-items: center;
  padding: 0 3px;
  box-sizing: border-box;
  cursor: pointer;
}

.acp-switch--on {
  background: #6d28d9;
  justify-content: flex-end;
}

.acp-switch__knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;
}

.acp-row-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  margin-left: 8px;
}

.acp-row-btn--danger {
  color: #dc2626;
  border-color: #fecaca;
}

.acp-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
}

.acp-state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.acp-state-sub {
  font-size: 13.5px;
  color: #6b7280;
}

.acp-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #dc2626;
}

.acp-error-banner__icon {
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

/* Add/edit dialog */
.acp-form-card {
  width: 520px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-sizing: border-box;
}

.acp-form-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 2px;
}

.acp-form-sub {
  font-size: 12.5px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.acp-form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.acp-form-field {
  flex: 1;
}

.acp-form-field--narrow {
  width: 150px;
  flex: none;
}

.acp-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 7px;
}

.acp-optional {
  font-weight: 400;
  color: #9ca3af;
}

.acp-template-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}

.acp-chip {
  font-family: ui-monospace, Menlo, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  font-size: 11.5px;
  font-weight: 600;
  color: #6d28d9;
  cursor: pointer;
}

.acp-template-preview {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 14px;
  padding: 13px 14px;
  box-sizing: border-box;
  margin-top: 10px;
}

.acp-template-preview--bad {
  background: #fef2f2;
  border-color: #fecaca;
}

.acp-template-preview__hint {
  font-size: 12px;
  color: #6d28d9;
}

.acp-template-preview__label {
  font-size: 11.5px;
  color: #6d28d9;
  margin-bottom: 5px;
}

.acp-template-preview__link {
  font-size: 12.5px;
  font-family: ui-monospace, Menlo, monospace;
  color: #8e4dff;
  word-break: break-all;
}

.acp-template-preview__ok {
  font-size: 11.5px;
  color: #16a34a;
  margin-top: 7px;
}

.acp-template-preview__bad-text {
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.acp-error {
  margin-top: 12px;
  font-size: 12.5px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 12px;
}

.acp-form-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  justify-content: flex-end;
}

.acp-btn {
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 13px 24px;
}

.acp-btn--secondary {
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.acp-btn--primary {
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.acp-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 860px) {
  .acp-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .acp-card {
    overflow-x: auto;
  }

  .acp-table {
    min-width: 640px;
  }
}
</style>
