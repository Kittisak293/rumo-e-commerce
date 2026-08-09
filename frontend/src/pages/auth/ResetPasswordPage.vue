<template>
  <div>
    <div class="auth-title">ตั้งรหัสผ่านใหม่</div>
    <div class="auth-subtitle auth-subtitle--tight">
      เราได้ส่งรหัสยืนยัน 6 หลักไปที่<br />
      <strong>{{ auth.maskedEmail }}</strong>
    </div>

    <OtpDigits v-model="code" tight />

    <div
      :class="[
        'auth-timer',
        'auth-timer--tight',
        { 'auth-timer--expired': timer.expired.value },
      ]"
    >
      {{ timer.timerLabel.value }}
    </div>

    <div class="auth-resend auth-resend--above-form">
      <a v-if="timer.canResend.value" href="#" @click.prevent="onResend">ส่งรหัสใหม่อีกครั้ง</a>
      <span v-else class="auth-resend__off">ส่งรหัสใหม่อีกครั้ง</span>
    </div>

    <form @submit.prevent="onSubmit">
      <AuthField
        v-model="newPassword"
        label="รหัสผ่านใหม่"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
        required
      />

      <AuthField
        v-model="confirmNewPassword"
        label="ยืนยันรหัสผ่านใหม่"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
        :invalid="mismatch"
        :error="mismatch ? 'รหัสผ่านไม่ตรงกัน' : ''"
        required
      />

      <button type="submit" class="auth-submit" :disabled="disabled">รีเซ็ตรหัสผ่าน</button>
    </form>

    <div class="auth-back">
      <router-link :to="{ name: 'login' }">← กลับไปหน้าเข้าสู่ระบบ</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import AuthField from 'components/auth/AuthField.vue';
import OtpDigits from 'components/auth/OtpDigits.vue';
import { useAuthStore } from 'src/stores/authStore';
import { useOtpTimer } from 'src/composables/useOtpTimer';

const router = useRouter();
const auth = useAuthStore();
const timer = useOtpTimer();

const code = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const mismatch = computed(
  () =>
    !!newPassword.value &&
    !!confirmNewPassword.value &&
    newPassword.value !== confirmNewPassword.value,
);

const disabled = computed(
  () =>
    code.value.length < 6 ||
    timer.expired.value ||
    !newPassword.value ||
    !confirmNewPassword.value ||
    newPassword.value !== confirmNewPassword.value,
);

onMounted(() => timer.start(auth.otpExpiresIn));

// The mockup puts the code and the new password on one screen, which matches
// the backend: reset-password takes otpToken + code + newPassword in one call.
async function onSubmit() {
  if (disabled.value) return;
  if (await auth.resetPassword(code.value, newPassword.value)) {
    timer.stop();
    Notify.create({
      color: 'positive',
      position: 'top',
      message: 'ตั้งรหัสผ่านใหม่สำเร็จ เข้าสู่ระบบด้วยรหัสใหม่ได้เลย',
      icon: 'check_circle',
    });
    await router.push({ name: 'login' });
  }
}

async function onResend() {
  if (!timer.canResend.value) return;
  if (await auth.resend()) {
    code.value = '';
    timer.start(auth.otpExpiresIn);
  }
}
</script>
