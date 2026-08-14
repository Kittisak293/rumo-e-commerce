<template>
  <div class="tracking-header">
    <div class="tracking-header__top">
      <div class="tracking-header__status-block">
        <div class="tracking-header__label">สถานะปัจจุบัน</div>
        <div class="tracking-header__status">{{ getStatusLabel(status) }}</div>
        <div v-if="lastLocation" class="tracking-header__location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" stroke="#fff" stroke-width="1.8" />
            <circle cx="12" cy="9.5" r="2.3" stroke="#fff" stroke-width="1.8" />
          </svg>
          <span>{{ lastLocation }}</span>
        </div>
      </div>
      <div v-if="estimatedDeliveryAt" class="tracking-header__eta">
        <div class="tracking-header__eta-label">คาดว่าจะได้รับ</div>
        <div class="tracking-header__eta-value">{{ formatThaiDate(estimatedDeliveryAt) }}</div>
      </div>
    </div>

    <div class="tracking-header__divider" />

    <div class="tracking-header__bottom">
      <div class="tracking-header__tracking-no">
        <div class="tracking-header__label">{{ carrierName }} · เลขพัสดุ</div>
        <div class="tracking-header__tracking-value">{{ trackingNumber ?? '—' }}</div>
      </div>
      <div class="tracking-header__spacer" />
      <button
        v-if="trackingNumber"
        type="button"
        class="tracking-header__copy"
        :class="{ 'tracking-header__copy--copied': copied }"
        @click="handleCopy"
      >
        <svg v-if="copied" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7" stroke="#16a34a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" stroke-width="1.8" />
        </svg>
        {{ copied ? 'คัดลอกแล้ว' : 'คัดลอกเลขพัสดุ' }}
      </button>
      <a v-if="trackingUrl" :href="trackingUrl" target="_blank" rel="noopener" class="tracking-header__link">
        ดูบนเว็บ {{ carrierName }}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getStatusLabel, formatThaiDate } from 'src/composables/useOrderStatus';

const props = defineProps<{
  status: string;
  lastLocation: string | null;
  estimatedDeliveryAt: string | null;
  carrierName: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}>();

const copied = ref(false);

async function handleCopy() {
  if (!props.trackingNumber) return;
  await navigator.clipboard.writeText(props.trackingNumber);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<style scoped>
.tracking-header {
  background: #6d28d9;
  border-radius: 18px;
  padding: 22px 24px;
  box-shadow: 0 4px 14px rgba(109, 40, 217, 0.3);
  box-sizing: border-box;
  color: #fff;
}

.tracking-header__top {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.tracking-header__status-block {
  flex: 1;
  min-width: 0;
}

.tracking-header__label {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.75);
}

.tracking-header__status {
  font-size: 26px;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: -0.3px;
}

.tracking-header__location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}

.tracking-header__eta {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 14px 18px;
  text-align: right;
}

.tracking-header__eta-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.tracking-header__eta-value {
  font-size: 19px;
  font-weight: 700;
  margin-top: 3px;
}

.tracking-header__divider {
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  margin: 18px 0 14px;
}

.tracking-header__bottom {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.tracking-header__tracking-no {
  min-width: 0;
}

.tracking-header__tracking-value {
  font-size: 17px;
  font-weight: 700;
  font-family: ui-monospace, Menlo, monospace;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.tracking-header__spacer {
  flex: 1;
}

.tracking-header__copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #6d28d9;
  background: #fff;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  box-sizing: border-box;
  transition: background 0.15s;
}

.tracking-header__copy:hover {
  background: #f5f3ff;
}

.tracking-header__copy--copied {
  color: #16a34a;
  background: #dcfce7;
  cursor: default;
}

.tracking-header__copy--copied:hover {
  background: #dcfce7;
}

.tracking-header__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 14px;
  box-sizing: border-box;
  text-decoration: none;
}

@media (max-width: 480px) {
  .tracking-header__bottom {
    flex-direction: column;
    align-items: stretch;
  }
  .tracking-header__spacer {
    display: none;
  }
  .tracking-header__copy,
  .tracking-header__link {
    justify-content: center;
    flex: 1;
  }
}
</style>
