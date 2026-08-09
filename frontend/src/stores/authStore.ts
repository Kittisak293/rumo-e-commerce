import { defineStore } from 'pinia';
import { Loading, Notify } from 'quasar';
import axios from 'axios';
import { api } from 'src/boot/axios';
import type {
  AuthUser,
  OtpChallengeResponse,
  OtpPurpose,
  VerifyOtpResponse,
} from 'src/models';
import { computed, ref } from 'vue';

const TOKEN_KEY = 'rumo.accessToken';
const USER_KEY = 'rumo.user';
/** Session, not local: an in-flight challenge should not outlive the tab. */
const CHALLENGE_KEY = 'rumo.otpChallenge';

interface StoredChallenge {
  otpToken: string;
  purpose: OtpPurpose;
  maskedEmail: string;
  /** Plaintext address, kept client-side only so password-reset can be resent. */
  email: string;
  expiresIn: number;
}

function readJson<T>(storage: Storage, key: string): T | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

/** Nest sends `message` as a string, or an array of strings from ValidationPipe. */
function describeError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string | string[] })?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    if (!err.response) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
  }
  return fallback;
}

function notifyError(err: unknown, fallback: string) {
  Notify.create({
    color: 'negative',
    position: 'top',
    message: describeError(err, fallback),
    icon: 'report_problem',
  });
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<AuthUser | null>(readJson<AuthUser>(localStorage, USER_KEY));
  const challenge = ref<StoredChallenge | null>(
    readJson<StoredChallenge>(sessionStorage, CHALLENGE_KEY),
  );

  const isAuthenticated = computed(() => !!accessToken.value);
  const otpToken = computed(() => challenge.value?.otpToken ?? null);
  const otpPurpose = computed(() => challenge.value?.purpose ?? null);
  const maskedEmail = computed(() => challenge.value?.maskedEmail ?? '');
  const otpExpiresIn = computed(() => challenge.value?.expiresIn ?? 300);

  function setSession(payload: VerifyOtpResponse) {
    accessToken.value = payload.access_token;
    user.value = payload.user;
    localStorage.setItem(TOKEN_KEY, payload.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }

  function setChallenge(
    res: OtpChallengeResponse,
    purpose: OtpPurpose,
    email: string,
  ) {
    challenge.value = {
      otpToken: res.otpToken,
      purpose,
      maskedEmail: res.email,
      email,
      expiresIn: res.expiresIn,
    };
    sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge.value));
  }

  function clearChallenge() {
    challenge.value = null;
    sessionStorage.removeItem(CHALLENGE_KEY);
  }

  function logout() {
    accessToken.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearChallenge();
  }

  /**
   * Password step. A success does not sign anybody in — it starts an OTP
   * challenge. An unverified address comes back as 403 carrying its own
   * email_verify challenge, which is a redirect to the verify screen, not an
   * error worth showing.
   */
  async function login(
    email: string,
    password: string,
  ): Promise<OtpPurpose | null> {
    try {
      Loading.show();
      const res = await api.post<OtpChallengeResponse>('/auth/login', {
        email,
        password,
      });
      setChallenge(res.data, 'login', email);
      return 'login';
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const body = err.response.data as OtpChallengeResponse & {
          emailVerificationRequired?: boolean;
          message?: string;
        };
        if (body.emailVerificationRequired) {
          Notify.create({
            color: 'warning',
            position: 'top',
            message: body.message ?? 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
            icon: 'mark_email_unread',
          });
          if (body.otpToken) {
            setChallenge(body, 'verifyEmail', email);
            return 'verifyEmail';
          }
          // Cooldown still held: the previous code is the live one, and there is
          // no new token to work with, so the user has to start from register.
          return null;
        }
      }
      notifyError(err, 'เข้าสู่ระบบไม่สำเร็จ');
      return null;
    } finally {
      Loading.hide();
    }
  }

  async function register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> {
    try {
      Loading.show();
      const res = await api.post<OtpChallengeResponse & { user: AuthUser }>(
        '/auth/register',
        payload,
      );
      setChallenge(res.data, 'verifyEmail', payload.email);
      return true;
    } catch (err) {
      notifyError(err, 'สมัครสมาชิกไม่สำเร็จ');
      return false;
    } finally {
      Loading.hide();
    }
  }

  /** Second factor for login. The only call that produces an access token. */
  async function verifyOtp(code: string): Promise<boolean> {
    if (!challenge.value) return false;
    try {
      Loading.show();
      const res = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
        otpToken: challenge.value.otpToken,
        code,
      });
      setSession(res.data);
      clearChallenge();
      return true;
    } catch (err) {
      notifyError(err, 'รหัสยืนยันไม่ถูกต้อง');
      return false;
    } finally {
      Loading.hide();
    }
  }

  /** Proves the address at signup. Deliberately does not sign the user in. */
  async function verifyEmail(code: string): Promise<boolean> {
    if (!challenge.value) return false;
    try {
      Loading.show();
      await api.post('/auth/verify-email', {
        otpToken: challenge.value.otpToken,
        code,
      });
      clearChallenge();
      return true;
    } catch (err) {
      notifyError(err, 'รหัสยืนยันไม่ถูกต้อง');
      return false;
    } finally {
      Loading.hide();
    }
  }

  async function forgotPassword(email: string): Promise<boolean> {
    try {
      Loading.show();
      const res = await api.post<OtpChallengeResponse>(
        '/auth/forgot-password',
        { email },
      );
      setChallenge(res.data, 'passwordReset', email);
      return true;
    } catch (err) {
      notifyError(err, 'ส่งรหัสยืนยันไม่สำเร็จ');
      return false;
    } finally {
      Loading.hide();
    }
  }

  async function resetPassword(
    code: string,
    newPassword: string,
  ): Promise<boolean> {
    if (!challenge.value) return false;
    try {
      Loading.show();
      await api.post('/auth/reset-password', {
        otpToken: challenge.value.otpToken,
        code,
        newPassword,
      });
      clearChallenge();
      return true;
    } catch (err) {
      notifyError(err, 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
      return false;
    } finally {
      Loading.hide();
    }
  }

  /**
   * Each flow rotates through its own endpoint. There is no `resend` for
   * password reset, so that one re-runs forgot-password with the address the
   * user typed — same challenge, same cooldown.
   */
  async function resend(): Promise<boolean> {
    const current = challenge.value;
    if (!current) return false;

    if (current.purpose === 'passwordReset') {
      return await forgotPassword(current.email);
    }

    const path =
      current.purpose === 'login' ? '/auth/resend-otp' : '/auth/resend-verification';
    try {
      Loading.show();
      const res = await api.post<OtpChallengeResponse>(path, {
        otpToken: current.otpToken,
      });
      setChallenge(res.data, current.purpose, current.email);
      Notify.create({
        color: 'positive',
        position: 'top',
        message: 'ส่งรหัสใหม่ให้แล้ว',
        icon: 'mark_email_read',
      });
      return true;
    } catch (err) {
      notifyError(err, 'ส่งรหัสใหม่ไม่สำเร็จ');
      return false;
    } finally {
      Loading.hide();
    }
  }

  return {
    accessToken,
    user,
    challenge,
    isAuthenticated,
    otpToken,
    otpPurpose,
    maskedEmail,
    otpExpiresIn,
    login,
    register,
    verifyOtp,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resend,
    clearChallenge,
    logout,
  };
});
