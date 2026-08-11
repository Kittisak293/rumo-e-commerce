<template>
  <div :class="['auth-otp', { 'auth-otp--tight': tight }]">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(el) => setRef(el, index)"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :aria-label="`หลักที่ ${index + 1}`"
      :value="digit"
      :class="['auth-otp__digit', { 'auth-otp__digit--filled': digit !== '' }]"
      @input="onInput(index, $event)"
      @keydown="onKeyDown(index, $event)"
      @paste="onPaste(index, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const OTP_LENGTH = 6;

const props = withDefaults(
  defineProps<{ modelValue: string; tight?: boolean; autofocus?: boolean }>(),
  { tight: false, autofocus: true },
);

const emit = defineEmits<{ 'update:modelValue': [string]; complete: [string] }>();

const boxes = ref<(HTMLInputElement | null)[]>([]);

const digits = computed(() =>
  Array.from({ length: OTP_LENGTH }, (_, i) => props.modelValue[i] ?? ''),
);

function setRef(el: unknown, index: number) {
  boxes.value[index] = el as HTMLInputElement | null;
}

function focusBox(index: number) {
  setTimeout(() => boxes.value[index]?.focus(), 0);
}

function commit(next: string[]) {
  const value = next.join('');
  emit('update:modelValue', value);
  if (value.length === OTP_LENGTH && !next.includes('')) {
    emit('complete', value);
  }
}

/**
 * Mirrors the mockup: a paste of several digits fills forward from the current
 * box, and the caret lands on the last one written.
 */
function onInput(index: number, event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  const next = [...digits.value];
  const entered = raw.replace(/\D/g, '').split('');

  if (entered.length === 0) {
    next[index] = '';
    commit(next);
    // Keep the DOM in step when a non-digit was typed and rejected.
    const box = boxes.value[index];
    if (box) box.value = '';
    return;
  }

  let cursor = index;
  for (const d of entered) {
    if (cursor >= OTP_LENGTH) break;
    next[cursor] = d;
    cursor++;
  }
  commit(next);
  focusBox(Math.min(cursor, OTP_LENGTH - 1));
}

/**
 * `maxlength="1"` truncates pasted text to a single character before the
 * `input` event fires, so a multi-digit paste must be read from
 * clipboardData directly instead of relying on onInput.
 */
function onPaste(index: number, event: ClipboardEvent) {
  const raw = event.clipboardData?.getData('text') ?? '';
  const entered = raw.replace(/\D/g, '').split('');
  if (entered.length === 0) return;

  event.preventDefault();
  const next = [...digits.value];
  let cursor = index;
  for (const d of entered) {
    if (cursor >= OTP_LENGTH) break;
    next[cursor] = d;
    cursor++;
  }
  commit(next);
  focusBox(Math.min(cursor, OTP_LENGTH - 1));
}

function onKeyDown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    focusBox(index - 1);
  } else if (event.key === 'ArrowLeft' && index > 0) {
    focusBox(index - 1);
  } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
    focusBox(index + 1);
  }
}

onMounted(() => {
  if (props.autofocus) focusBox(0);
});

defineExpose({ focusFirst: () => focusBox(0) });
</script>
