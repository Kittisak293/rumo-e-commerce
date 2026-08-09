<template>
  <div>
    <div class="auth-title">ลืมรหัสผ่าน?</div>
    <div class="auth-subtitle auth-subtitle--muted">
      กรอกอีเมลที่ใช้สมัคร เราจะส่งรหัสยืนยันไปให้คุณ
    </div>

    <form @submit.prevent="onSubmit">
      <AuthField
        v-model="email"
        label="อีเมล"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        spacing="last"
        required
      />

      <button type="submit" class="auth-submit">ส่งรหัสยืนยัน</button>
    </form>

    <div class="auth-back">
      <router-link :to="{ name: 'login' }">← กลับไปหน้าเข้าสู่ระบบ</router-link>
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

async function onSubmit() {
  if (!email.value) return;
  // Answers identically whether or not the address exists, so there is nothing
  // to branch on here — a success always means "go enter the code".
  if (await auth.forgotPassword(email.value)) {
    await router.push({ name: 'resetPassword' });
  }
}
</script>
