<template>
  <div :class="['auth-field', groupClass]">
    <label :for="id" class="auth-field__label">{{ label }}</label>
    <div class="auth-field__wrap">
      <input
        :id="id"
        :type="resolvedType"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        :value="modelValue"
        :class="[
          'auth-field__input',
          { 'auth-field__input--with-toggle': toggleable },
          { 'auth-field__input--invalid': invalid },
        ]"
        @input="onInput"
      />
      <button
        v-if="toggleable"
        type="button"
        class="auth-field__toggle"
        :aria-label="revealed ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
        @click="revealed = !revealed"
      >
        {{ revealed ? 'ซ่อน' : 'แสดง' }}
      </button>
    </div>
    <div v-if="error" class="auth-field__error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    type?: 'text' | 'email' | 'password';
    placeholder?: string;
    required?: boolean;
    autocomplete?: string;
    invalid?: boolean;
    error?: string;
    /** `tight` = 8px bottom margin, `last` = 20px. Default is 16px. */
    spacing?: 'default' | 'tight' | 'last';
  }>(),
  {
    type: 'text',
    placeholder: '',
    required: false,
    autocomplete: '',
    invalid: false,
    error: '',
    spacing: 'default',
  },
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const revealed = ref(false);
const id = `auth-field-${Math.random().toString(36).slice(2, 9)}`;

const toggleable = computed(() => props.type === 'password');
const resolvedType = computed(() =>
  toggleable.value && revealed.value ? 'text' : props.type,
);
const groupClass = computed(() =>
  props.spacing === 'default' ? '' : `auth-field--${props.spacing}`,
);

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>
