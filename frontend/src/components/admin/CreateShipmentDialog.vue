<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="csd-card">
      <div class="csd-header">
        <div class="csd-header__title">สร้างพัสดุ</div>
        <div class="csd-header__sub">{{ order.orderNumber }}</div>
      </div>

      <div class="csd-body">
        <div class="csd-form">
          <div class="csd-label">บริษัทขนส่ง</div>
          <q-select
            v-model="carrierId"
            dense
            outlined
            emit-value
            map-options
            :options="carrierOptions"
            placeholder="เลือกขนส่ง"
            class="csd-select q-mb-md"
          />

          <div class="csd-label">เลขพัสดุ</div>
          <q-input v-model="trackingNumber" dense outlined placeholder="เช่น TH2761884203" class="q-mb-xs" />
          <div class="csd-hint">คีย์ตามใบเสร็จของขนส่ง — เลขนี้จะไปอยู่ในอีเมลลูกค้าตรง ๆ</div>

          <div class="csd-row q-mt-md">
            <div class="csd-row__field">
              <div class="csd-label">ตำแหน่งเริ่มต้น <span class="csd-optional">(ไม่บังคับ)</span></div>
              <q-input v-model="lastLocation" dense outlined placeholder="เช่น ศูนย์กระจายสินค้าชลบุรี" />
            </div>
            <div class="csd-row__field csd-row__field--narrow">
              <div class="csd-label">คาดว่าจะถึง</div>
              <q-input v-model="estimatedDeliveryAt" dense outlined type="date" />
            </div>
          </div>

          <div class="csd-warning">
            <div class="csd-warning__head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 6l8 6 8-6M4 6h16v12H4V6z" stroke="#6d28d9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>อีเมลนี้จะถูกส่งทันทีที่กดยืนยัน</span>
            </div>
            <div class="csd-email-preview">
              <div class="csd-email-preview__label">ถึง</div>
              <div class="csd-email-preview__value">{{ order.user.name }} · {{ order.user.email }}</div>
              <div class="csd-email-preview__label">หัวเรื่อง</div>
              <div class="csd-email-preview__value csd-email-preview__value--last">พัสดุของคุณกำลังเดินทาง · {{ order.orderNumber }}</div>
              <div class="csd-email-preview__body">
                {{ selectedCarrierName || 'บริษัทขนส่ง' }} · เลขพัสดุ
                <b>{{ trackingNumber || '—' }}</b>
              </div>
            </div>
          </div>

          <div v-if="store.actionError" class="csd-error">{{ store.actionError }}</div>

          <div class="csd-actions">
            <button type="button" class="csd-btn csd-btn--secondary" @click="close">ยกเลิก</button>
            <button
              type="button"
              class="csd-btn csd-btn--primary"
              :disabled="!canSubmit || store.actionLoading"
              @click="submit"
            >
              {{ store.actionLoading ? 'กำลังสร้าง...' : 'สร้างพัสดุและส่งอีเมล' }}
            </button>
          </div>
        </div>

        <div class="csd-context">
          <div class="csd-context__title">ออเดอร์ที่กำลังทำ</div>
          <div class="csd-context__name">{{ order.user.name }}</div>
          <div class="csd-context__email">{{ order.user.email }}</div>

          <div class="csd-divider" />
          <div class="csd-context__label">จัดส่งถึง</div>
          <div class="csd-context__address">
            {{ order.address.fullName }} · {{ order.address.phone }}<br />
            {{ order.address.subdistrict }}, {{ order.address.district }},<br />
            {{ order.address.province }} {{ order.address.postalCode }}
          </div>

          <div class="csd-divider" />
          <div class="csd-context__label">สินค้าในคำสั่งซื้อนี้ · {{ order.totalQuantity }} ชิ้น</div>
          <div class="csd-items">
            <div v-for="item in order.orderItems" :key="item.id" class="csd-item">
              <img :src="getImageUrl(item.product.imageUrl)" :alt="item.product.name" class="csd-item__img" />
              <div class="csd-item__info">
                <div class="csd-item__name">{{ item.product.name }}</div>
                <div class="csd-item__meta">x{{ item.quantity }} · ฿{{ Number(item.price).toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <div class="csd-divider" />
          <div class="csd-context__total-row">
            <span>ยอดรวม</span>
            <span class="csd-context__total">฿{{ Number(order.total).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAdminShipmentStore } from 'src/stores/adminShipmentStore';
import type { AdminOrderData } from 'src/stores/adminShipmentStore';
import { getImageUrl } from 'src/utils/imageUrl';

const props = defineProps<{ modelValue: boolean; order: AdminOrderData }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; created: [] }>();

const store = useAdminShipmentStore();

const carrierId = ref<number | null>(null);
const trackingNumber = ref('');
const lastLocation = ref('');
const estimatedDeliveryAt = ref('');

const carrierOptions = computed(() =>
  store.carriers.filter((c) => c.isActive).map((c) => ({ label: c.name, value: c.id })),
);

const selectedCarrierName = computed(
  () => store.carriers.find((c) => c.id === carrierId.value)?.name ?? '',
);

const canSubmit = computed(() => !!carrierId.value && trackingNumber.value.trim().length > 0);

function resetForm() {
  carrierId.value = null;
  trackingNumber.value = '';
  lastLocation.value = '';
  estimatedDeliveryAt.value = '';
  store.clearActionError();
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm();
  },
);

function close() {
  emit('update:modelValue', false);
}

async function submit() {
  if (!canSubmit.value || !carrierId.value) return;
  const ok = await store.createShipment({
    orderId: props.order.id,
    carrierId: carrierId.value,
    trackingNumber: trackingNumber.value.trim(),
    ...(lastLocation.value.trim() ? { lastLocation: lastLocation.value.trim() } : {}),
    ...(estimatedDeliveryAt.value ? { estimatedDeliveryAt: new Date(estimatedDeliveryAt.value).toISOString() } : {}),
  });
  if (ok) {
    emit('created');
    close();
  }
}
</script>

<style scoped>
.csd-card {
  width: 820px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  box-sizing: border-box;
  overflow: hidden;
}

.csd-header {
  padding: 18px 22px;
  border-bottom: 1px solid #f3f4f6;
}

.csd-header__title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
}

.csd-header__sub {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 2px;
}

.csd-body {
  display: flex;
  align-items: stretch;
}

.csd-form {
  width: 470px;
  flex-shrink: 0;
  padding: 20px 22px;
  box-sizing: border-box;
}

.csd-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 7px;
}

.csd-optional {
  font-weight: 400;
  color: #9ca3af;
}

.csd-select :deep(.q-field__control) {
  border-radius: 14px;
}

.csd-hint {
  font-size: 11.5px;
  color: #9ca3af;
}

.csd-row {
  display: flex;
  gap: 12px;
}

.csd-row__field {
  flex: 1;
}

.csd-row__field--narrow {
  width: 150px;
  flex: none;
}

.csd-warning {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 14px;
  padding: 14px;
  box-sizing: border-box;
  margin-top: 16px;
}

.csd-warning__head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #6d28d9;
}

.csd-email-preview {
  background: #fff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 13px 14px;
  box-sizing: border-box;
}

.csd-email-preview__label {
  font-size: 11.5px;
  color: #9ca3af;
}

.csd-email-preview__value {
  font-size: 12.5px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 8px;
}

.csd-email-preview__value--last {
  margin-bottom: 10px;
}

.csd-email-preview__body {
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.7;
}

.csd-error {
  margin-top: 12px;
  font-size: 12.5px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 12px;
}

.csd-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.csd-btn {
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.csd-btn--secondary {
  padding: 13px 20px;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.csd-btn--primary {
  flex: 1;
  padding: 13px;
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.csd-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.csd-context {
  flex: 1;
  background: #fafafa;
  border-left: 1px solid #f3f4f6;
  padding: 20px;
  box-sizing: border-box;
}

.csd-context__title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 12px;
}

.csd-context__name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1d1d1d;
}

.csd-context__email {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 2px;
}

.csd-divider {
  border-top: 1px solid #e5e7eb;
  margin: 14px 0;
}

.csd-context__label {
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.csd-context__address {
  font-size: 13px;
  color: #1d1d1d;
  line-height: 1.6;
}

.csd-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.csd-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.csd-item__img {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f3f4f6;
  flex-shrink: 0;
  object-fit: cover;
}

.csd-item__info {
  min-width: 0;
}

.csd-item__name {
  font-size: 12.5px;
  color: #1d1d1d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.csd-item__meta {
  font-size: 11.5px;
  color: #9ca3af;
}

.csd-context__total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12.5px;
  color: #6b7280;
}

.csd-context__total {
  font-size: 20px;
  font-weight: 700;
  color: #6d28d9;
}

@media (max-width: 720px) {
  .csd-card {
    width: 100%;
    max-width: 100vw;
    border-radius: 0;
  }

  .csd-body {
    flex-direction: column;
  }

  .csd-form,
  .csd-context {
    width: 100%;
  }

  .csd-context {
    border-left: none;
    border-top: 1px solid #f3f4f6;
  }
}
</style>
