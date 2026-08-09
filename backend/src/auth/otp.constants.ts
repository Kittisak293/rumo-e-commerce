import { createHash } from 'crypto';

/**
 * Rate-limit bucket for an address. Lower-cased so Bob@X.com and bob@x.com
 * share one bucket, and hashed so raw addresses never sit in the key space.
 */
export const emailKey = (email: string): string =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

export const chalKey = (jti: string): string => `otp:chal:${jti}`;
export const cooldownKey = (ek: string): string => `otp:cooldown:${ek}`;
export const failKey = (ek: string): string => `otp:fail:${ek}`;

/** Token type claims. AuthGuard only accepts ACCESS_TOKEN_TYPE. */
export const ACCESS_TOKEN_TYPE = 'access';

/**
 * One challenge purpose per flow. All three are signed with the same
 * OTP_JWT_SECRET, so this claim — checked on the way in, and again against the
 * copy stored in Redis — is what stops a token minted for one flow being spent
 * on another.
 */
export const OTP_TOKEN_TYPE = 'otp_challenge'; // login second factor
export const EMAIL_VERIFY_TOKEN_TYPE = 'email_verify';
export const PASSWORD_RESET_TOKEN_TYPE = 'password_reset';

export type OtpPurpose =
  | typeof OTP_TOKEN_TYPE
  | typeof EMAIL_VERIFY_TOKEN_TYPE
  | typeof PASSWORD_RESET_TOKEN_TYPE;

export interface OtpChallengePayload {
  jti: string;
  typ: OtpPurpose;
}
