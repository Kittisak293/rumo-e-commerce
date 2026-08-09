import {
  EMAIL_VERIFY_TOKEN_TYPE,
  PASSWORD_RESET_TOKEN_TYPE,
  OTP_TOKEN_TYPE,
  type OtpPurpose,
} from 'src/auth/otp.constants';

export interface RenderedMail {
  subject: string;
  text: string;
  html: string;
}

interface Copy {
  subject: (code: string) => string;
  heading: string;
  lead: string;
  /** Shown when the recipient did not start this flow. */
  disclaimer: string;
}

const COPY: Record<OtpPurpose, Copy> = {
  [OTP_TOKEN_TYPE]: {
    subject: (code) => `รหัสยืนยัน RUMO: ${code}`,
    heading: 'รหัสยืนยันการเข้าสู่ระบบ',
    lead: 'กรอกรหัสด้านล่างเพื่อเข้าสู่ระบบ RUMO',
    disclaimer:
      'หากคุณไม่ได้เป็นคนขอเข้าสู่ระบบ ให้เพิกเฉยต่ออีเมลนี้และเปลี่ยนรหัสผ่านของคุณ',
  },
  [EMAIL_VERIFY_TOKEN_TYPE]: {
    subject: (code) => `ยืนยันอีเมลของคุณ — รหัส ${code}`,
    heading: 'ยืนยันอีเมลของคุณ',
    lead: 'ขอบคุณที่สมัครใช้งาน RUMO กรอกรหัสด้านล่างเพื่อยืนยันอีเมลนี้',
    disclaimer:
      'หากคุณไม่ได้เป็นคนสมัครบัญชีนี้ ให้เพิกเฉยต่ออีเมลนี้ได้เลย บัญชีจะใช้งานไม่ได้จนกว่าจะมีการยืนยัน',
  },
  [PASSWORD_RESET_TOKEN_TYPE]: {
    subject: (code) => `รีเซ็ตรหัสผ่าน RUMO — รหัส ${code}`,
    heading: 'รีเซ็ตรหัสผ่าน',
    lead: 'กรอกรหัสด้านล่างเพื่อตั้งรหัสผ่านใหม่สำหรับบัญชี RUMO ของคุณ',
    disclaimer:
      'หากคุณไม่ได้เป็นคนขอรีเซ็ตรหัสผ่าน ให้เพิกเฉยต่ออีเมลนี้ รหัสผ่านเดิมของคุณจะยังใช้ได้ตามปกติ',
  },
};

export function buildOtpEmail(
  code: string,
  ttlSeconds: number,
  purpose: OtpPurpose = OTP_TOKEN_TYPE,
): RenderedMail {
  const minutes = Math.max(1, Math.round(ttlSeconds / 60));
  const copy = COPY[purpose] ?? COPY[OTP_TOKEN_TYPE];

  return {
    subject: copy.subject(code),
    text: [
      copy.heading,
      ``,
      `รหัสของคุณคือ ${code}`,
      ``,
      `รหัสนี้ใช้ได้ ${minutes} นาที และใช้ได้เพียงครั้งเดียว`,
      copy.disclaimer,
    ].join('\n'),
    html: `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
  <h1 style="margin:0 0 8px;font-size:18px;font-weight:600">${copy.heading}</h1>
  <p style="margin:0 0 24px;font-size:14px;color:#666">${copy.lead}</p>
  <div style="font-size:34px;font-weight:700;letter-spacing:.32em;padding:20px 0;text-align:center;background:#f5f5f5;border-radius:10px">${code}</div>
  <p style="margin:24px 0 0;font-size:13px;color:#666">
    รหัสนี้ใช้ได้ <strong>${minutes} นาที</strong> และใช้ได้เพียงครั้งเดียว
  </p>
  <p style="margin:12px 0 0;font-size:13px;color:#666">${copy.disclaimer}</p>
</div>`.trim(),
  };
}
