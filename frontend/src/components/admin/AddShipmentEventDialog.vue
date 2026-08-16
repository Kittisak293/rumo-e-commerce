<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="aed-card">
      <div class="aed-header">
        <div class="aed-header__main">
          <div class="aed-header__title">บันทึกเหตุการณ์พัสดุ</div>
          <div class="aed-header__sub">{{ order.user.name }} · {{ shipment.carrier.name }} · {{ shipment.trackingNumber }}</div>
        </div>
        <ShipmentStatusPill :status="shipment.status" />
      </div>

      <div class="aed-body">
        <div class="aed-panel">
          <div class="aed-panel__head">
            <div class="aed-panel__title">ประวัติที่บันทึกไปแล้ว</div>
            <div class="aed-panel__count">{{ events.length }} เหตุการณ์ · เรียงจากล่าสุด</div>
          </div>
          <div v-if="events.length === 0" class="aed-empty-timeline">ยังไม่มีเหตุการณ์ของพัสดุนี้</div>
          <ShipmentTimeline v-else :events="events" />
        </div>

        <div class="aed-panel">
          <div class="aed-form-title">เพิ่มเหตุการณ์ใหม่</div>
          <div class="aed-form-hint">กดจุดสแกนมาตรฐานเพื่อเติมให้อัตโนมัติ แล้วแก้ข้อความ/เวลาตามใบเสร็จจริง</div>

          <div class="aed-presets">
            <button
              v-for="(preset, idx) in PRESETS"
              :key="preset.status + idx"
              type="button"
              class="aed-preset"
              :class="{ 'aed-preset--active': status === preset.status && description === preset.description }"
              @click="applyPreset(preset)"
            >
              <span class="aed-preset__num">{{ idx + 1 }}</span>
              {{ preset.label }}
            </button>
          </div>

          <div class="aed-row">
            <div class="aed-row__field aed-row__field--status">
              <div class="aed-label">สถานะพัสดุ</div>
              <q-select v-model="status" dense outlined emit-value map-options :options="STATUS_OPTIONS" />
            </div>
            <div class="aed-row__field">
              <div class="aed-label">ตำแหน่ง <span class="aed-optional">(ไม่บังคับ)</span></div>
              <q-input v-model="location" dense outlined placeholder="เช่น ศูนย์คัดแยกชลบุรี" />
            </div>
            <div class="aed-row__field aed-row__field--time">
              <div class="aed-label">เวลาที่เกิดเหตุการณ์</div>
              <q-input v-model="occurredAt" dense outlined type="datetime-local" />
            </div>
          </div>

          <div class="aed-label">รายละเอียดเหตุการณ์</div>
          <q-input v-model="description" dense outlined type="textarea" rows="2" placeholder="เช่น พัสดุถึงศูนย์คัดแยกปลายทาง" />

          <div v-if="autoOrderStatusLabel" class="aed-auto-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6l8 6 8-6M4 6h16v12H4V6z" stroke="#6d28d9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>
              บันทึกแล้วสถานะคำสั่งซื้อจะเปลี่ยนเป็น <b>{{ autoOrderStatusLabel }}</b> อัตโนมัติ ·
              ลูกค้าเห็นเหตุการณ์นี้ในหน้าติดตามพัสดุทันที
            </span>
          </div>

          <div v-if="store.actionError" class="aed-error">{{ store.actionError }}</div>

          <div class="aed-actions">
            <button type="button" class="aed-btn aed-btn--secondary" @click="resetForm">ล้างฟอร์ม</button>
            <button
              type="button"
              class="aed-btn aed-btn--primary"
              :disabled="!canSubmit || store.actionLoading"
              @click="onSaveClick"
            >
              {{ store.actionLoading ? 'กำลังบันทึก...' : 'บันทึกเหตุการณ์' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm before recording the event + possibly moving the order status -->
    <q-dialog v-model="confirmOpen">
      <div class="aed-confirm-modal">
        <div class="aed-confirm-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M4 6l8 6 8-6M4 6h16v12H4V6z" stroke="#6d28d9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="aed-confirm-title">ยืนยันบันทึกเหตุการณ์พัสดุ?</div>
        <div class="aed-confirm-desc">
          ลูกค้าจะเห็นเหตุการณ์นี้ในหน้าติดตามพัสดุทันที
          <template v-if="autoOrderStatusLabel">สถานะคำสั่งซื้อจะเปลี่ยนเป็น <b>{{ autoOrderStatusLabel }}</b> ด้วย</template>
        </div>
        <div class="aed-confirm-summary">
          <div class="aed-confirm-summary__row">
            <span>สถานะพัสดุ</span>
            <span>{{ getShipmentStatusMeta(status).label }}</span>
          </div>
          <div v-if="location" class="aed-confirm-summary__row">
            <span>ตำแหน่ง</span>
            <span>{{ location }}</span>
          </div>
          <div class="aed-confirm-summary__row">
            <span>รายละเอียด</span>
            <span>{{ description }}</span>
          </div>
        </div>
        <div class="aed-confirm-actions">
          <button
            type="button"
            class="aed-btn aed-btn--secondary"
            style="flex: 1"
            :disabled="store.actionLoading"
            @click="confirmOpen = false"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            class="aed-btn aed-btn--primary"
            style="flex: 1"
            :disabled="store.actionLoading"
            @click="onConfirmSubmit"
          >
            {{ store.actionLoading ? 'กำลังบันทึก...' : 'ยืนยันบันทึก' }}
          </button>
        </div>
      </div>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAdminShipmentStore } from 'src/stores/adminShipmentStore';
import type { AdminOrderData } from 'src/stores/adminShipmentStore';
import type { ShipmentData } from 'src/stores/orderStore';
import ShipmentTimeline from 'src/components/orders/ShipmentTimeline.vue';
import ShipmentStatusPill from 'src/components/admin/ShipmentStatusPill.vue';
import {
  SHIPMENT_STATUS_META,
  ORDER_STATUS_FOR_SHIPMENT_EVENT,
  getOrderStatusMeta,
  getShipmentStatusMeta,
} from 'src/composables/useOrderStatus';

const props = defineProps<{ modelValue: boolean; order: AdminOrderData; shipment: ShipmentData }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [] }>();

const store = useAdminShipmentStore();

const STATUS_OPTIONS = Object.entries(SHIPMENT_STATUS_META).map(([value, meta]) => ({
  label: meta.label,
  value,
}));

interface Preset {
  status: string;
  label: string;
  description: string;
}

const PRESETS: Preset[] = [
  { status: 'pending', label: 'เตรียมพัสดุ', description: 'ผู้ขายเตรียมพัสดุเรียบร้อย รอขนส่งเข้ารับ' },
  { status: 'picked_up', label: 'ขนส่งเข้ารับ', description: 'ขนส่งเข้ารับพัสดุแล้ว' },
  { status: 'in_transit', label: 'ออกจากศูนย์กระจาย', description: 'พัสดุออกจากศูนย์กระจายสินค้า' },
  { status: 'in_transit', label: 'ถึงศูนย์คัดแยกปลายทาง', description: 'พัสดุถึงศูนย์คัดแยกปลายทาง' },
  { status: 'out_for_delivery', label: 'พนักงานกำลังนำจ่าย', description: 'พนักงานกำลังนำจ่าย' },
  { status: 'delivered', label: 'ส่งถึงผู้รับเรียบร้อย', description: 'ส่งถึงผู้รับเรียบร้อย' },
  { status: 'failed', label: 'นำจ่ายไม่สำเร็จ', description: 'นำจ่ายไม่สำเร็จ ไม่พบผู้รับ' },
  { status: 'returned', label: 'พัสดุถูกตีกลับผู้ขาย', description: 'พัสดุถูกตีกลับผู้ขาย' },
];

const events = computed(() => props.shipment.shipmentEvents ?? []);

const status = ref('pending');
const description = ref('');
const location = ref('');
const occurredAt = ref('');
const confirmOpen = ref(false);

function nowLocalInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function resetForm() {
  status.value = 'pending';
  description.value = '';
  location.value = '';
  occurredAt.value = nowLocalInput();
  confirmOpen.value = false;
  store.clearActionError();
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm();
  },
);

function applyPreset(preset: Preset) {
  status.value = preset.status;
  description.value = preset.description;
}

const canSubmit = computed(() => description.value.trim().length > 0);

const autoOrderStatusLabel = computed(() => {
  const target = ORDER_STATUS_FOR_SHIPMENT_EVENT[status.value];
  return target ? getOrderStatusMeta(target).label : '';
});

function onSaveClick() {
  if (!canSubmit.value) return;
  confirmOpen.value = true;
}

async function onConfirmSubmit() {
  await submit();
  confirmOpen.value = false;
}

async function submit() {
  if (!canSubmit.value) return;
  const ok = await store.addShipmentEvent({
    shipmentId: props.shipment.id,
    status: status.value,
    description: description.value.trim(),
    ...(location.value.trim() ? { location: location.value.trim() } : {}),
    ...(occurredAt.value ? { occurredAt: new Date(occurredAt.value).toISOString() } : {}),
  });
  if (ok) {
    emit('saved');
    resetForm();
  }
}
</script>

<style scoped>
.aed-card {
  width: 1000px;
  max-width: 94vw;
  background: #fafafa;
  border-radius: 18px;
  box-sizing: border-box;
  padding: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

.aed-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 16px;
}

.aed-header__main {
  flex: 1;
}

.aed-header__title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1d;
}

.aed-header__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.aed-panel {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  margin-bottom: 14px;
}

.aed-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.aed-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
}

.aed-panel__count {
  font-size: 12.5px;
  color: #9ca3af;
}

.aed-empty-timeline {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 20px 0;
}

.aed-form-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 4px;
}

.aed-form-hint {
  font-size: 12.5px;
  color: #9ca3af;
  margin-bottom: 14px;
}

.aed-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.aed-preset {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  font-size: 12.5px;
  font-weight: 500;
  color: #1d1d1d;
  cursor: pointer;
  font-family: inherit;
  box-sizing: border-box;
}

.aed-preset__num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aed-preset--active {
  border: 1.5px solid #8e4dff;
  background: #f5f3ff;
  font-weight: 600;
  color: #6d28d9;
}

.aed-preset--active .aed-preset__num {
  background: #8e4dff;
  color: #fff;
}

.aed-preset--failed {
  border-color: #fecaca;
  color: #dc2626;
  font-weight: 600;
}

.aed-preset--returned {
  border-color: #fed7aa;
  color: #c2410c;
  font-weight: 600;
}

.aed-row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.aed-row__field {
  flex: 1;
  min-width: 0;
}

.aed-row__field--status {
  width: 230px;
  flex: none;
}

.aed-row__field--time {
  width: 210px;
  flex: none;
}

.aed-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 7px;
}

.aed-optional {
  font-weight: 400;
  color: #9ca3af;
}

.aed-auto-note {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 14px;
  padding: 12px 14px;
  box-sizing: border-box;
  margin: 14px 0;
  font-size: 12.5px;
  color: #6d28d9;
}

.aed-error {
  font-size: 12.5px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.aed-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.aed-btn {
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 13px 24px;
}

.aed-btn--secondary {
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.aed-btn--primary {
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.aed-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.aed-confirm-modal {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  padding: 28px 24px;
  text-align: center;
}

.aed-confirm-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.aed-confirm-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 8px;
}

.aed-confirm-desc {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 16px;
}

.aed-confirm-summary {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 12px 14px;
  box-sizing: border-box;
  margin-bottom: 20px;
  text-align: left;
}

.aed-confirm-summary__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  color: #6b7280;
}

.aed-confirm-summary__row + .aed-confirm-summary__row {
  margin-top: 6px;
}

.aed-confirm-summary__row span:last-child {
  font-weight: 600;
  color: #1d1d1d;
  text-align: right;
}

.aed-confirm-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 720px) {
  .aed-card {
    width: 100%;
    max-width: 100vw;
    border-radius: 0;
  }

  .aed-row {
    flex-direction: column;
  }

  .aed-row__field--status,
  .aed-row__field--time {
    width: 100%;
  }

  .aed-presets {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
</style>
