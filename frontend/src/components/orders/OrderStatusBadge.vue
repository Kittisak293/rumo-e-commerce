<template>
  <span class="status-badge" :style="badgeStyle">
    <span class="status-badge__dot" :style="{ background: meta.color }" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getOrderStatusMeta } from 'src/composables/useOrderStatus';

const props = defineProps<{ status: string }>();

const meta = computed(() => getOrderStatusMeta(props.status));

const badgeStyle = computed(() => ({
  color: meta.value.color,
  background: meta.value.bg,
  border: meta.value.border ? `1px solid ${meta.value.border}` : 'none',
}));
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 13px;
  border-radius: 999px;
  white-space: nowrap;
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
