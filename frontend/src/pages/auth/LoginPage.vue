<template>
  <div>
    <div class="auth-title">เข้าสู่ระบบ</div>
    <div class="auth-subtitle-spacer"></div>

    <form @submit.prevent="onSubmit">
      <AuthField
        v-model="email"
        label="อีเมล"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />

      <AuthField
        v-model="password"
        label="รหัสผ่าน"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        spacing="tight"
        required
      />

      <div class="auth-forgot">
        <router-link :to="{ name: 'forgotPassword' }">ลืมรหัสผ่าน?</router-link>
      </div>

      <button type="submit" class="auth-submit">เข้าสู่ระบบ</button>
    </form>

    <div class="auth-footer">
      ยังไม่มีบัญชี?
      <router-link :to="{ name: 'register' }">สมัครสมาชิก</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthField from 'components/auth/AuthField.vue';
import { useAuthStore } from 'src/stores/authStore';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');

async function onSubmit() {
  // A correct password lands on the OTP screen, never straight into the app.
  // An unverified address comes back as 'verifyEmail' — same screen, other flow.
  const purpose = await auth.login(email.value, password.value);
  if (purpose) {
    await router.push({ name: 'verifyOtp' });
  }
}
</script>
