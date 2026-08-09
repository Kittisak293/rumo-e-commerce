<template>
  <div>
    <div :class="['auth-timer', { 'auth-timer--expired': expired, 'auth-timer--tight': tight }]">
      {{ timerLabel }}
    </div>
    <slot />
    <div :class="['auth-resend', { 'auth-resend--above-form': tight }]">
      <a v-if="canResend" href="#" @click.prevent="emit('resend')">ส่งรหัสใหม่อีกครั้ง</a>
      <span v-else class="auth-resend__off">ส่งรหัสใหม่อีกครั้ง</span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    timerLabel: string;
    expired: boolean;
    canResend: boolean;
    /** Reset screen puts the timer above the form, with tighter spacing. */
    tight?: boolean;
  }>(),
  { tight: false },
);

const emit = defineEmits<{ resend: [] }>();
</script>
