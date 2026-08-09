<template>
  <div>
    <div class="auth-title">{{ title }}</div>
    <div class="auth-subtitle">
      เราได้ส่งรหัสยืนยัน 6 หลักไปที่<br />
      <strong>{{ auth.maskedEmail }}</strong>
    </div>

    <!-- No auto-submit on the sixth digit: the design has an explicit ยืนยัน
         button, and the server only allows five wrong guesses per code. -->
    <OtpDigits v-model="code" />

    <div :class="['auth-timer', { 'auth-timer--expired': timer.expired.value }]">
      {{ timer.timerLabel.value }}
    </div>

    <button type="button" class="auth-submit" :disabled="disabled" @click="onSubmit">
      ยืนยัน
    </button>

    <div class="auth-resend">
      <a v-if="timer.canResend.value" href="#" @click.prevent="onResend">ส่งรหัสใหม่อีกครั้ง</a>
      <span v-else class="auth-resend__off">ส่งรหัสใหม่อีกครั้ง</span>
    </div>

    <div class="auth-back">
      <a href="#" @click.prevent="onBack">{{ backLabel }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import OtpDigits from 'components/auth/OtpDigits.vue';
import { useAuthStore } from 'src/stores/authStore';
import { useOtpTimer } from 'src/composables/useOtpTimer';

const router = useRouter();
const auth = useAuthStore();
const timer = useOtpTimer();

const code = ref('');

/** One screen, two flows — exactly as `isOtpView` did in the mockup. */
const isVerifyEmail = computed(() => auth.otpPurpose === 'verifyEmail');

const title = computed(() =>
  isVerifyEmail.value ? 'ยืนยันอีเมลเพื่อเปิดใช้งานบัญชี' : 'ยืนยันรหัส OTP',
);
const backLabel = computed(() =>
  isVerifyEmail.value ? '← กลับไปหน้าสมัครสมาชิก' : '← กลับไปหน้าเข้าสู่ระบบ',
);

const disabled = computed(() => code.value.length < 6 || timer.expired.value);

onMounted(() => timer.start(auth.otpExpiresIn));

async function onSubmit() {
  if (disabled.value) return;

  if (isVerifyEmail.value) {
    // Verification proves the address but issues no token — the user still logs in.
    if (await auth.verifyEmail(code.value)) {
      timer.stop();
      Notify.create({
        color: 'positive',
        position: 'top',
        message: 'ยืนยันอีเมลสำเร็จ เข้าสู่ระบบได้เลย',
        icon: 'check_circle',
      });
      await router.push({ name: 'login' });
    }
    return;
  }

  if (await auth.verifyOtp(code.value)) {
    timer.stop();
    Notify.create({
      color: 'positive',
      position: 'top',
      message: 'เข้าสู่ระบบสำเร็จ',
      icon: 'check_circle',
    });
    await router.push({ name: 'home' });
  }
}

async function onResend() {
  if (!timer.canResend.value) return;
  if (await auth.resend()) {
    code.value = '';
    timer.start(auth.otpExpiresIn);
  }
}

async function onBack() {
  timer.stop();
  const target = isVerifyEmail.value ? 'register' : 'login';
  auth.clearChallenge();
  await router.push({ name: target });
}
</script>
