import { computed, onUnmounted, ref } from 'vue';

/** Backend defaults: OTP_TTL_SECONDS=300, OTP_RESEND_COOLDOWN_SECONDS=60. */
const EXPIRE_SECONDS = 300;
const RESEND_SECONDS = 60;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Counts down the code's lifetime and the resend cooldown, exactly as the
 * mockup did. These are display only — the server enforces both independently.
 */
export function useOtpTimer() {
  const expireLeft = ref(EXPIRE_SECONDS);
  const resendLeft = ref(RESEND_SECONDS);
  let timerId: ReturnType<typeof setInterval> | undefined;

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = undefined;
    }
  }

  function start(expireSeconds = EXPIRE_SECONDS, resendSeconds = RESEND_SECONDS) {
    stop();
    expireLeft.value = expireSeconds;
    resendLeft.value = Math.min(resendSeconds, expireSeconds);
    timerId = setInterval(() => {
      expireLeft.value = Math.max(0, expireLeft.value - 1);
      resendLeft.value = Math.max(0, resendLeft.value - 1);
      if (expireLeft.value === 0 && resendLeft.value === 0) stop();
    }, 1000);
  }

  onUnmounted(stop);

  const expired = computed(() => expireLeft.value <= 0);
  const canResend = computed(() => resendLeft.value <= 0);
  const timerLabel = computed(() =>
    expired.value
      ? 'รหัสหมดอายุแล้ว กรุณาส่งรหัสใหม่'
      : `รหัสหมดอายุใน ${formatTime(expireLeft.value)}`,
  );

  return { expireLeft, resendLeft, expired, canResend, timerLabel, start, stop };
}
