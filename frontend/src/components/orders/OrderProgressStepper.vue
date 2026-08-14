<template>
  <div class="stepper">
    <div v-for="(step, index) in STEPS" :key="step.key" class="stepper__item">
      <div class="stepper__track">
        <div class="stepper__line" :class="{ 'stepper__line--first': index === 0 }" :style="lineStyle(index - 1)" />
        <div class="stepper__circle" :class="circleClass(index)">
          <svg v-if="index < (currentStep ?? -1)" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-else-if="index === currentStep" class="stepper__dot stepper__dot--current" />
          <span v-else class="stepper__dot stepper__dot--future" />
        </div>
        <div class="stepper__line" :class="{ 'stepper__line--last': index === STEPS.length - 1 }" :style="lineStyle(index)" />
      </div>
      <div class="stepper__title" :class="stateClass(index)">{{ step.title }}</div>
      <div v-if="dateLabels?.[index]" class="stepper__date" :class="stateClass(index)">{{ dateLabels[index] }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Fixed 4-step happy path (mockup 2a/2b). Orders that leave this path
// (cancelled/refunded/failed/still pending) don't render this component at
// all — the page shows an explanatory card instead (mockup 2e).
const STEPS = [
  { key: 'paid', title: 'ชำระเงิน' },
  { key: 'shipped', title: 'เตรียมจัดส่ง' },
  { key: 'shipping', title: 'กำลังจัดส่ง' },
  { key: 'delivered', title: 'ส่งถึง' },
] as const;

const props = defineProps<{
  /** 0-3, the step currently active. */
  currentStep: 0 | 1 | 2 | 3;
  /** Optional formatted date/time string per step, same length as STEPS. */
  dateLabels?: (string | null)[];
}>();

function stateClass(index: number): string {
  if (index < props.currentStep) return 'is-done';
  if (index === props.currentStep) return 'is-current';
  return 'is-future';
}

function circleClass(index: number): string {
  return `stepper__circle--${stateClass(index).replace('is-', '')}`;
}

// Segment i sits between step i and i+1; it's "done" once the order has
// reached step i+1 — matches the mockup, where the connector into the
// currently-active circle is still highlighted purple.
function lineStyle(segmentIndex: number) {
  if (segmentIndex < 0 || segmentIndex >= STEPS.length - 1) return {};
  return { background: segmentIndex < props.currentStep ? '#8e4dff' : '#e5e7eb' };
}
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: flex-start;
}

.stepper__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.stepper__track {
  display: flex;
  align-items: center;
  width: 100%;
}

.stepper__line {
  flex: 1;
  height: 3px;
}

.stepper__line--first,
.stepper__line--last {
  background: transparent !important;
}

.stepper__circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.stepper__circle--done {
  background: #6d28d9;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.stepper__circle--current {
  background: #fff;
  border: 3px solid #8e4dff;
}

.stepper__circle--future {
  background: #f3f4f6;
  border: 1.5px solid #e5e7eb;
}

.stepper__dot--current {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8e4dff;
  display: block;
}

.stepper__dot--future {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  display: block;
}

.stepper__title {
  font-size: 13px;
  font-weight: 600;
  margin-top: 10px;
  text-align: center;
}

.stepper__title.is-done {
  color: #1d1d1d;
}

.stepper__title.is-current {
  color: #6d28d9;
}

.stepper__title.is-future {
  color: #9ca3af;
  font-weight: 500;
}

.stepper__date {
  font-size: 11.5px;
  margin-top: 2px;
  text-align: center;
}

.stepper__date.is-done {
  color: #9ca3af;
}

.stepper__date.is-current {
  color: #8e4dff;
}

.stepper__date.is-future {
  color: #9ca3af;
}

@media (max-width: 480px) {
  .stepper__title {
    font-size: 11.5px;
  }
  .stepper__date {
    font-size: 10px;
  }
  .stepper__circle {
    width: 30px;
    height: 30px;
  }
}
</style>
