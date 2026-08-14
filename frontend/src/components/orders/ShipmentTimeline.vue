<template>
  <div class="timeline">
    <div v-for="(event, index) in events" :key="event.id" class="timeline__row">
      <div class="timeline__rail">
        <span class="timeline__dot" />
        <span v-if="index < events.length - 1" class="timeline__line" />
      </div>
      <div class="timeline__content" :class="{ 'timeline__content--last': index === events.length - 1 }">
        <div class="timeline__headline">
          <span class="timeline__desc">{{ event.description }}</span>
          <span v-if="index === 0" class="timeline__latest">ล่าสุด</span>
        </div>
        <div class="timeline__meta">
          <template v-if="event.location">{{ event.location }} · </template>{{ formatThaiDateShort(event.occurredAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShipmentEventData } from 'src/stores/orderStore';
import { formatThaiDateShort } from 'src/composables/useOrderStatus';

// Expects newest-first order — the backend already sorts shipmentEvents by
// occurredAt DESC (mockup 3a: "เรียงจากเหตุการณ์ล่าสุด").
defineProps<{ events: ShipmentEventData[] }>();
</script>

<style scoped>
.timeline__row {
  display: flex;
  gap: 16px;
}

.timeline__rail {
  width: 20px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5px;
}

.timeline__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8e4dff;
  flex-shrink: 0;
}

.timeline__line {
  width: 2px;
  flex: 1;
  background: #e5e7eb;
  margin-top: 2px;
}

.timeline__content {
  flex: 1;
  min-width: 0;
  padding-bottom: 22px;
}

.timeline__content--last {
  padding-bottom: 0;
}

.timeline__headline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline__desc {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1d;
}

.timeline__latest {
  font-size: 11px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 2px 9px;
  border-radius: 999px;
  flex-shrink: 0;
}

.timeline__meta {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>
