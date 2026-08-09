<template>
  <div>
    <div class="auth-title">สมัครสมาชิก</div>
    <div class="auth-subtitle-spacer"></div>

    <form @submit.prevent="onSubmit">
      <div class="auth-row">
        <AuthField
          v-model="firstName"
          label="ชื่อ"
          placeholder="ชื่อจริง"
          autocomplete="given-name"
          required
        />
        <AuthField
          v-model="lastName"
          label="นามสกุล"
          placeholder="นามสกุล"
          autocomplete="family-name"
          required
        />
      </div>

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
        autocomplete="new-password"
        required
      />

      <AuthField
        v-model="confirmPassword"
        label="ยืนยันรหัสผ่าน"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
        spacing="last"
        :invalid="mismatch"
        :error="mismatch ? 'รหัสผ่านไม่ตรงกัน' : ''"
        required
      />

      <label class="auth-terms">
        <input v-model="agreedToTerms" type="checkbox" />
        <span>
          ฉันยอมรับ<a href="#" @click.prevent>ข้อตกลงการใช้งาน</a>และ<a
            href="#"
            @click.prevent
            >นโยบายความเป็นส่วนตัว</a
          >ของ RUMO
        </span>
      </label>

      <button type="submit" class="auth-submit" :disabled="disabled">สมัครสมาชิก</button>
    </form>

    <div class="auth-footer">
      มีบัญชีแล้ว?
      <router-link :to="{ name: 'login' }">เข้าสู่ระบบ</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthField from 'components/auth/AuthField.vue';
import { useAuthStore } from 'src/stores/authStore';

const router = useRouter();
const auth = useAuthStore();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreedToTerms = ref(false);

const mismatch = computed(
  () => !!password.value && !!confirmPassword.value && password.value !== confirmPassword.value,
);

const disabled = computed(
  () =>
    !(
      firstName.value &&
      lastName.value &&
      email.value &&
      password.value &&
      confirmPassword.value &&
      password.value === confirmPassword.value &&
      agreedToTerms.value
    ),
);

async function onSubmit() {
  if (disabled.value) return;
  // The form splits the name in two; the backend stores a single `name` column.
  const ok = await auth.register({
    name: `${firstName.value.trim()} ${lastName.value.trim()}`.trim(),
    email: email.value,
    password: password.value,
  });
  if (ok) {
    await router.push({ name: 'verifyOtp' });
  }
}
</script>
