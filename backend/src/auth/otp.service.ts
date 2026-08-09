import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { REDIS_CLIENT } from '../redis/redis.constants';
import {
  chalKey,
  cooldownKey,
  emailKey,
  failKey,
  OTP_TOKEN_TYPE,
  type OtpPurpose,
} from './otp.constants';

export interface OtpChallenge {
  jti: string;
  /** Plaintext code. Goes straight to MailService — never returned by the API, never logged. */
  code: string;
  ttl: number;
}

export interface VerifiedChallenge {
  userId: number;
  email: string;
}

@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  private num(key: string, fallback: number): number {
    return Number(this.configService.get(key, fallback));
  }

  /**
   * crypto.randomInt draws from the OS CSPRNG and rejection-samples for a
   * uniform distribution. Math.random() is neither: observe a few outputs and
   * its internal state — and every future code — is recoverable.
   */
  private generateCode(): string {
    const length = this.num('OTP_CODE_LENGTH', 6);
    return String(randomInt(0, 10 ** length)).padStart(length, '0');
  }

  /**
   * HMAC, not bcrypt: an OTP has only ~20 bits of entropy but a 5-guess budget,
   * so slow hashing buys nothing the pepper doesn't already buy. The pepper
   * lives in env and never in Redis, which is what makes a stolen dump inert.
   */
  private hashCode(code: string): Buffer {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('OTP_HASH_SECRET'),
    )
      .update(code)
      .digest();
  }

  async createChallenge(
    userId: number,
    email: string,
    purpose: OtpPurpose = OTP_TOKEN_TYPE,
  ): Promise<OtpChallenge> {
    const ek = emailKey(email);
    const cooldown = this.num('OTP_RESEND_COOLDOWN_SECONDS', 60);

    // Deliberately NOT namespaced by purpose: the cap that matters is total
    // emails per address per minute. Splitting it per flow would triple an
    // attacker's mail-bombing budget for the same victim.
    //
    // Atomic test-and-set. EXISTS-then-SET has a race in the middle where two
    // concurrent logins both see "no cooldown" and both send an email.
    const acquired = await this.redis.set(
      cooldownKey(ek),
      '1',
      'EX',
      cooldown,
      'NX',
    );
    if (acquired !== 'OK') {
      const wait = await this.redis.ttl(cooldownKey(ek));
      throw new HttpException(
        `Please wait ${Math.max(wait, 1)}s before requesting another code`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const jti = randomUUID();
    const code = this.generateCode();
    const ttl = this.num('OTP_TTL_SECONDS', 300);

    await this.redis
      .multi()
      .hset(chalKey(jti), {
        email,
        userId: String(userId),
        purpose,
        codeHash: this.hashCode(code).toString('hex'),
        attempts: '0',
        createdAt: String(Date.now()),
      })
      .expire(chalKey(jti), ttl)
      .exec();

    return { jti, code, ttl };
  }

  async verifyChallenge(
    jti: string,
    submitted: string,
    purpose: OtpPurpose = OTP_TOKEN_TYPE,
  ): Promise<VerifiedChallenge> {
    const key = chalKey(jti);
    const data = await this.redis.hgetall(key);

    // hgetall on a missing key resolves to {}, not null.
    if (!data || Object.keys(data).length === 0) {
      throw new UnauthorizedException('Code expired or already used');
    }

    // Second half of the flow binding: the caller proved which purpose it wants
    // via a signed claim, and the stored record has to agree. Checked before the
    // attempt counter so a cross-flow probe cannot burn a legitimate challenge.
    if ((data.purpose || OTP_TOKEN_TYPE) !== purpose) {
      throw new UnauthorizedException('Code expired or already used');
    }

    const ek = emailKey(data.email);

    // Cross-challenge lockout. Without this, an attacker just asks for a fresh
    // challenge every 5 guesses and walks the whole 10^6 space.
    const fails = Number(await this.redis.get(failKey(ek))) || 0;
    if (fails >= this.num('OTP_EMAIL_LOCK_MAX', 10)) {
      await this.redis.del(key);
      throw new HttpException(
        'Too many failed attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // HINCRBY is atomic and returns the post-increment value, so 50 parallel
    // guesses genuinely see 1..50 rather than all reading attempts=0.
    const attempts = await this.redis.hincrby(key, 'attempts', 1);
    // If the key expired between HGETALL and HINCRBY, HINCRBY recreated it with
    // no TTL. EXPIRE ... NX only sets one when there isn't one, so the phantom
    // still dies. It has no codeHash, so it can never verify either way.
    await this.redis.expire(key, this.num('OTP_TTL_SECONDS', 300), 'NX');

    if (attempts > this.num('OTP_MAX_ATTEMPTS', 5)) {
      await this.redis.del(key);
      await this.bumpFailures(ek);
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }

    // Hash first, then compare: two 32-byte digests always have equal length,
    // so timingSafeEqual can never throw on a length mismatch.
    const candidate = this.hashCode(submitted.trim());
    const stored = Buffer.from(data.codeHash ?? '', 'hex');
    const matches =
      stored.length === candidate.length && timingSafeEqual(stored, candidate);

    if (!matches) {
      await this.bumpFailures(ek);
      throw new UnauthorizedException('Invalid code');
    }

    // One-time use, for free: DEL returns how many keys it actually removed, so
    // exactly one racing request gets 1 and the rest get 0.
    if ((await this.redis.del(key)) !== 1) {
      throw new UnauthorizedException('Code already used');
    }

    await this.redis.del(failKey(ek));
    return { userId: Number(data.userId), email: data.email };
  }

  /**
   * Issue a fresh code for the user behind an existing challenge, then burn the
   * old one. The new challenge is created first so that hitting the resend
   * cooldown leaves the user with the code they already have.
   */
  async rotateChallenge(
    jti: string,
    purpose: OtpPurpose = OTP_TOKEN_TYPE,
  ): Promise<OtpChallenge & { email: string }> {
    const data = await this.redis.hgetall(chalKey(jti));
    if (!data || Object.keys(data).length === 0) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    if ((data.purpose || OTP_TOKEN_TYPE) !== purpose) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const next = await this.createChallenge(
      Number(data.userId),
      data.email,
      purpose,
    );
    await this.redis.del(chalKey(jti));
    return { ...next, email: data.email };
  }

  private async bumpFailures(ek: string): Promise<void> {
    const count = await this.redis.incr(failKey(ek));
    if (count === 1) {
      await this.redis.expire(
        failKey(ek),
        this.num('OTP_EMAIL_LOCK_WINDOW_SECONDS', 900),
      );
    }
  }
}
