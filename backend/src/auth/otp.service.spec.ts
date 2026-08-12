import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { OtpService } from './otp.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import {
  chalKey,
  emailKey,
  failKey,
  EMAIL_VERIFY_TOKEN_TYPE,
  OTP_TOKEN_TYPE,
  PASSWORD_RESET_TOKEN_TYPE,
} from './otp.constants';

const CONFIG: Record<string, string | number> = {
  OTP_CODE_LENGTH: 6,
  OTP_TTL_SECONDS: 300,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  OTP_EMAIL_LOCK_MAX: 10,
  OTP_EMAIL_LOCK_WINDOW_SECONDS: 900,
  OTP_HASH_SECRET: 'test-pepper',
};

const hashOf = (code: string) =>
  createHmac('sha256', 'test-pepper').update(code).digest('hex');

const EMAIL = 'user@example.com';
const JTI = 'challenge-1';

describe('OtpService', () => {
  let service: OtpService;
  let redis: {
    set: jest.Mock;
    get: jest.Mock;
    ttl: jest.Mock;
    del: jest.Mock;
    incr: jest.Mock;
    expire: jest.Mock;
    hgetall: jest.Mock;
    hincrby: jest.Mock;
    multi: jest.Mock;
  };

  /** A live challenge for `code`, with no prior attempts. */
  const challengeFor = (
    code: string,
    purpose: string = OTP_TOKEN_TYPE,
    attempts = '0',
  ) => ({
    email: EMAIL,
    userId: '7',
    purpose,
    codeHash: hashOf(code),
    attempts,
    createdAt: String(Date.now()),
  });

  beforeEach(async () => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      ttl: jest.fn().mockResolvedValue(42),
      del: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      hgetall: jest.fn().mockResolvedValue({}),
      hincrby: jest.fn().mockResolvedValue(1),
      multi: jest.fn(() => ({
        hset: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: REDIS_CLIENT, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => CONFIG[key] ?? fallback,
            getOrThrow: (key: string) => CONFIG[key],
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('createChallenge', () => {
    it('generates a zero-padded 6-digit code', async () => {
      const { code } = await service.createChallenge(7, EMAIL);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('draws codes from a wide distribution', async () => {
      const seen = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        seen.add((await service.createChallenge(7, EMAIL)).code);
      }
      // 1000 uniform draws from 10^6 collide only rarely.
      expect(seen.size).toBeGreaterThan(900);
    });

    it('claims the cooldown with SET NX so concurrent logins cannot both send', async () => {
      await service.createChallenge(7, EMAIL);
      expect(redis.set).toHaveBeenCalledWith(
        `otp:cooldown:${emailKey(EMAIL)}`,
        '1',
        'EX',
        60,
        'NX',
      );
    });

    it('throws 429 when the cooldown is already held', async () => {
      redis.set.mockResolvedValue(null);
      await expect(service.createChallenge(7, EMAIL)).rejects.toBeInstanceOf(
        HttpException,
      );
      expect(redis.multi).not.toHaveBeenCalled();
    });

    it('never stores the plaintext code', async () => {
      const hset = jest.fn().mockReturnThis();
      redis.multi.mockReturnValue({
        hset,
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const { code } = await service.createChallenge(7, EMAIL);
      const stored = hset.mock.calls[0][1] as Record<string, string>;

      expect(stored.codeHash).toBe(hashOf(code));
      expect(JSON.stringify(stored)).not.toContain(code);
    });
  });

  describe('verifyChallenge', () => {
    it('rejects a missing challenge without counting an attempt', async () => {
      redis.hgetall.mockResolvedValue({});
      await expect(
        service.verifyChallenge(JTI, '123456'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(redis.hincrby).not.toHaveBeenCalled();
    });

    it('accepts the correct code and returns the user', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      await expect(service.verifyChallenge(JTI, '042917')).resolves.toEqual({
        userId: 7,
        email: EMAIL,
      });
    });

    it('deletes the challenge exactly once on success', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      await service.verifyChallenge(JTI, '042917');

      const challengeDeletes = redis.del.mock.calls.filter(
        ([key]) => key === chalKey(JTI),
      );
      expect(challengeDeletes).toHaveLength(1);
    });

    it('rejects a replay when DEL reports the key was already gone', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      redis.del.mockResolvedValue(0);
      await expect(
        service.verifyChallenge(JTI, '042917'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('counts a failure on a wrong code but not on a right one', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      await expect(service.verifyChallenge(JTI, '111111')).rejects.toThrow();
      expect(redis.incr).toHaveBeenCalledWith(failKey(emailKey(EMAIL)));

      redis.incr.mockClear();
      await service.verifyChallenge(JTI, '042917');
      expect(redis.incr).not.toHaveBeenCalled();
    });

    it('burns the challenge once attempts exceed the maximum', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      redis.hincrby.mockResolvedValue(6);

      await expect(
        service.verifyChallenge(JTI, '042917'), // right code, but out of budget
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(redis.del).toHaveBeenCalledWith(chalKey(JTI));
    });

    it('re-arms the TTL with NX so an expired key cannot be resurrected forever', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      await service.verifyChallenge(JTI, '042917');
      expect(redis.expire).toHaveBeenCalledWith(chalKey(JTI), 300, 'NX');
    });

    it('locks the address out across challenges once the fail counter is full', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      redis.get.mockResolvedValue('10');

      await expect(
        service.verifyChallenge(JTI, '042917'), // right code, but locked out
      ).rejects.toBeInstanceOf(HttpException);
      expect(redis.hincrby).not.toHaveBeenCalled();
    });
  });

  // The storage half of the flow binding. The JWT `typ` claim is the first half
  // (auth.service.spec.ts); this is the backstop if a caller ever passes the
  // wrong purpose through.
  describe('purpose binding', () => {
    it('records the purpose alongside the challenge', async () => {
      const hset = jest.fn().mockReturnThis();
      redis.multi.mockReturnValue({
        hset,
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await service.createChallenge(7, EMAIL, PASSWORD_RESET_TOKEN_TYPE);
      const stored = hset.mock.calls[0][1] as Record<string, string>;
      expect(stored.purpose).toBe(PASSWORD_RESET_TOKEN_TYPE);
    });

    it('refuses to spend a password_reset challenge on the login flow', async () => {
      redis.hgetall.mockResolvedValue(
        challengeFor('042917', PASSWORD_RESET_TOKEN_TYPE),
      );

      await expect(
        service.verifyChallenge(JTI, '042917', OTP_TOKEN_TYPE),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuses to spend a login challenge on email verification', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917', OTP_TOKEN_TYPE));

      await expect(
        service.verifyChallenge(JTI, '042917', EMAIL_VERIFY_TOKEN_TYPE),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('does not burn the challenge on a cross-flow probe', async () => {
      redis.hgetall.mockResolvedValue(
        challengeFor('042917', EMAIL_VERIFY_TOKEN_TYPE),
      );

      await expect(
        service.verifyChallenge(JTI, '042917', OTP_TOKEN_TYPE),
      ).rejects.toThrow();
      expect(redis.hincrby).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
      expect(redis.incr).not.toHaveBeenCalled();
    });

    it('accepts each purpose against its own challenge', async () => {
      for (const purpose of [
        OTP_TOKEN_TYPE,
        EMAIL_VERIFY_TOKEN_TYPE,
        PASSWORD_RESET_TOKEN_TYPE,
      ] as const) {
        redis.hgetall.mockResolvedValue(challengeFor('042917', purpose));
        await expect(
          service.verifyChallenge(JTI, '042917', purpose),
        ).resolves.toEqual({ userId: 7, email: EMAIL });
      }
    });

    it('treats a challenge written before purposes existed as a login', async () => {
      const legacy = challengeFor('042917');
      delete (legacy as { purpose?: string }).purpose;
      redis.hgetall.mockResolvedValue(legacy);

      await expect(
        service.verifyChallenge(JTI, '042917', OTP_TOKEN_TYPE),
      ).resolves.toEqual({ userId: 7, email: EMAIL });
    });
  });

  describe('rotateChallenge', () => {
    it('issues a new challenge and burns the old one', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));

      const next = await service.rotateChallenge(JTI);

      expect(next.email).toBe(EMAIL);
      expect(next.jti).not.toBe(JTI);
      expect(redis.del).toHaveBeenCalledWith(chalKey(JTI));
    });

    it('carries the purpose across the rotation', async () => {
      redis.hgetall.mockResolvedValue(
        challengeFor('042917', EMAIL_VERIFY_TOKEN_TYPE),
      );
      const hset = jest.fn().mockReturnThis();
      redis.multi.mockReturnValue({
        hset,
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await service.rotateChallenge(JTI, EMAIL_VERIFY_TOKEN_TYPE);
      const stored = hset.mock.calls[0][1] as Record<string, string>;
      expect(stored.purpose).toBe(EMAIL_VERIFY_TOKEN_TYPE);
    });

    it('refuses to rotate a challenge from another flow', async () => {
      redis.hgetall.mockResolvedValue(
        challengeFor('042917', PASSWORD_RESET_TOKEN_TYPE),
      );

      await expect(
        service.rotateChallenge(JTI, EMAIL_VERIFY_TOKEN_TYPE),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(redis.del).not.toHaveBeenCalled();
      expect(redis.multi).not.toHaveBeenCalled();
    });

    it('keeps the old code alive when the resend cooldown blocks it', async () => {
      redis.hgetall.mockResolvedValue(challengeFor('042917'));
      redis.set.mockResolvedValue(null);

      await expect(service.rotateChallenge(JTI)).rejects.toBeInstanceOf(
        HttpException,
      );
      expect(redis.del).not.toHaveBeenCalledWith(chalKey(JTI));
    });
  });
});
