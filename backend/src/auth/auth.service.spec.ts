import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import {
  ACCESS_TOKEN_TYPE,
  EMAIL_VERIFY_TOKEN_TYPE,
  OTP_TOKEN_TYPE,
  PASSWORD_RESET_TOKEN_TYPE,
} from './otp.constants';

// bcrypt is a native addon and its exports are non-configurable, so jest.spyOn
// cannot patch them — the whole module has to be mocked.
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
const compare = bcrypt.compare as unknown as jest.Mock;
const hash = bcrypt.hash as unknown as jest.Mock;

const CONFIG: Record<string, string> = {
  JWT_SECRET: 'access-secret',
  OTP_JWT_SECRET: 'challenge-secret',
};

const USER = {
  id: 7,
  email: 'user@example.com',
  passwordHash: '$2b$04$Rh1YQ8Z5Yb2kQ3E5cQ0mUeR9y9F5m4Q4jH1Q1jH1Q1jH1Q1jH1Q1j',
  role: 'customer' as const,
  name: 'Test',
  age: 20,
  emailVerified: true,
};

const CHALLENGE = { jti: 'challenge-1', code: '042917', ttl: 300 };

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findOneByEmailForAuth: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    markEmailVerified: jest.Mock;
    updatePasswordHash: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let otpService: {
    createChallenge: jest.Mock;
    verifyChallenge: jest.Mock;
    rotateChallenge: jest.Mock;
  };
  let mailService: { sendOtp: jest.Mock };

  /** Make the next readOtpToken() see a token minted for `typ`. */
  const incomingToken = (typ: string) =>
    jwtService.verifyAsync.mockResolvedValue({ jti: 'challenge-1', typ });

  beforeEach(async () => {
    compare.mockReset().mockResolvedValue(true);
    hash.mockReset().mockResolvedValue('new-hash');

    usersService = {
      findOneByEmailForAuth: jest.fn().mockResolvedValue(USER),
      findOne: jest.fn().mockResolvedValue({ id: 7, email: USER.email }),
      create: jest.fn().mockResolvedValue({ ...USER, emailVerified: false }),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
      updatePasswordHash: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ jti: 'challenge-1', typ: OTP_TOKEN_TYPE }),
    };
    otpService = {
      createChallenge: jest.fn().mockResolvedValue(CHALLENGE),
      verifyChallenge: jest
        .fn()
        .mockResolvedValue({ userId: 7, email: USER.email }),
      rotateChallenge: jest.fn().mockResolvedValue({
        jti: 'challenge-2',
        code: '111111',
        ttl: 300,
        email: USER.email,
      }),
    };
    mailService = { sendOtp: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: OtpService, useValue: otpService },
        { provide: MailService, useValue: mailService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => CONFIG[key] ?? fallback,
            getOrThrow: (key: string) => CONFIG[key],
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ---------------------------------------------------------------------------

  describe('register', () => {
    const DTO = {
      email: 'new@example.com',
      name: 'New',
      password: 'password123',
    };

    beforeEach(() =>
      usersService.findOneByEmailForAuth.mockResolvedValue(null),
    );

    it('creates the account and issues an email_verify challenge', async () => {
      const result = await service.register(DTO);

      expect(usersService.create).toHaveBeenCalledWith(DTO);
      expect(otpService.createChallenge).toHaveBeenCalledWith(
        7,
        USER.email,
        EMAIL_VERIFY_TOKEN_TYPE,
      );
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        USER.email,
        '042917',
        300,
        EMAIL_VERIFY_TOKEN_TYPE,
      );
      expect(result.otpToken).toBe('signed-token');
    });

    it('scopes the token to email_verify, not the login flow', async () => {
      await service.register(DTO);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { jti: 'challenge-1', typ: EMAIL_VERIFY_TOKEN_TYPE },
        expect.objectContaining({ secret: 'challenge-secret' }),
      );
    });

    it('never returns the password hash or the code', async () => {
      const result = await service.register(DTO);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(result)).not.toContain('042917');
    });

    it('rejects an address that already has an account', async () => {
      usersService.findOneByEmailForAuth.mockResolvedValue(USER);
      await expect(service.register(DTO)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => incomingToken(EMAIL_VERIFY_TOKEN_TYPE));

    it('marks the account verified and issues no access token', async () => {
      const result = await service.verifyEmail('token', '042917');

      expect(otpService.verifyChallenge).toHaveBeenCalledWith(
        'challenge-1',
        '042917',
        EMAIL_VERIFY_TOKEN_TYPE,
      );
      expect(usersService.markEmailVerified).toHaveBeenCalledWith(7);
      expect(result).not.toHaveProperty('access_token');
      expect(result.emailVerified).toBe(true);
    });

    it('refuses a login otpToken', async () => {
      incomingToken(OTP_TOKEN_TYPE);
      await expect(
        service.verifyEmail('login-token', '042917'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.markEmailVerified).not.toHaveBeenCalled();
    });

    it('refuses a password-reset token', async () => {
      incomingToken(PASSWORD_RESET_TOKEN_TYPE);
      await expect(
        service.verifyEmail('reset-token', '042917'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(otpService.verifyChallenge).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('rotates within the email_verify flow', async () => {
      incomingToken(EMAIL_VERIFY_TOKEN_TYPE);
      await service.resendVerification('token');

      expect(otpService.rotateChallenge).toHaveBeenCalledWith(
        'challenge-1',
        EMAIL_VERIFY_TOKEN_TYPE,
      );
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        USER.email,
        '111111',
        300,
        EMAIL_VERIFY_TOKEN_TYPE,
      );
    });
  });

  // ---------------------------------------------------------------------------

  describe('startLogin', () => {
    it('emails the code and returns only a challenge token', async () => {
      const result = await service.startLogin(USER.email, 'secret');

      expect(mailService.sendOtp).toHaveBeenCalledWith(
        USER.email,
        '042917',
        300,
        OTP_TOKEN_TYPE,
      );
      expect(result.otpToken).toBe('signed-token');
      // The code must never travel back over HTTP, not even in dev.
      expect(JSON.stringify(result)).not.toContain('042917');
    });

    it('signs the challenge token with OTP_JWT_SECRET, not JWT_SECRET', async () => {
      await service.startLogin(USER.email, 'secret');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { jti: 'challenge-1', typ: OTP_TOKEN_TYPE },
        expect.objectContaining({ secret: 'challenge-secret', expiresIn: 300 }),
      );
    });

    it('masks the destination address', async () => {
      const { email } = await service.startLogin(USER.email, 'secret');
      expect(email).toBe('us**@example.com');
    });

    it('still hashes when the account does not exist, so timing does not leak', async () => {
      usersService.findOneByEmailForAuth.mockResolvedValue(null);

      await expect(
        service.startLogin('nobody@example.com', 'secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(compare).toHaveBeenCalled();
      expect(otpService.createChallenge).not.toHaveBeenCalled();
    });

    it('reports a wrong password identically to an unknown account', async () => {
      compare.mockResolvedValue(false);
      const wrongPassword = await service
        .startLogin(USER.email, 'nope')
        .catch((e: Error) => e.message);

      usersService.findOneByEmailForAuth.mockResolvedValue(null);
      const unknownUser = await service
        .startLogin('nobody@example.com', 'nope')
        .catch((e: Error) => e.message);

      expect(wrongPassword).toBe(unknownUser);
    });

    it('does not fail the request when delivery throws', async () => {
      mailService.sendOtp.mockRejectedValue(new Error('smtp down'));
      await expect(
        service.startLogin(USER.email, 'secret'),
      ).resolves.toHaveProperty('otpToken');
    });

    describe('when the address is not verified', () => {
      beforeEach(() =>
        usersService.findOneByEmailForAuth.mockResolvedValue({
          ...USER,
          emailVerified: false,
        }),
      );

      it('refuses before any login OTP is created', async () => {
        await expect(
          service.startLogin(USER.email, 'secret'),
        ).rejects.toBeInstanceOf(ForbiddenException);

        expect(otpService.createChallenge).toHaveBeenCalledWith(
          7,
          USER.email,
          EMAIL_VERIFY_TOKEN_TYPE,
        );
        expect(otpService.createChallenge).not.toHaveBeenCalledWith(
          7,
          USER.email,
          OTP_TOKEN_TYPE,
        );
      });

      it('bundles a fresh verification token so the client can recover', async () => {
        const error: ForbiddenException = await service
          .startLogin(USER.email, 'secret')
          .catch((e: ForbiddenException) => e);
        const body = error.getResponse() as Record<string, unknown>;

        expect(body.emailVerificationRequired).toBe(true);
        expect(body.otpToken).toBe('signed-token');
      });

      it('still refuses, without a token, while the resend cooldown holds', async () => {
        otpService.createChallenge.mockRejectedValue(
          new HttpException('wait', HttpStatus.TOO_MANY_REQUESTS),
        );

        const error: ForbiddenException = await service
          .startLogin(USER.email, 'secret')
          .catch((e: ForbiddenException) => e);
        const body = error.getResponse() as Record<string, unknown>;

        expect(error).toBeInstanceOf(ForbiddenException);
        expect(body.emailVerificationRequired).toBe(true);
        expect(body.otpToken).toBeUndefined();
      });

      it('does not leak account state before the password is checked', async () => {
        compare.mockResolvedValue(false);
        await expect(
          service.startLogin(USER.email, 'wrong'),
        ).rejects.toBeInstanceOf(UnauthorizedException);
      });
    });
  });

  describe('verifyOtp', () => {
    it('mints an access token carrying typ=access', async () => {
      const result = await service.verifyOtp('otp-token', '042917');

      expect(otpService.verifyChallenge).toHaveBeenCalledWith(
        'challenge-1',
        '042917',
        OTP_TOKEN_TYPE,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 7,
        email: USER.email,
        typ: ACCESS_TOKEN_TYPE,
      });
      expect(result.access_token).toBe('signed-token');
    });

    it('refuses an email_verify token', async () => {
      incomingToken(EMAIL_VERIFY_TOKEN_TYPE);
      await expect(
        service.verifyOtp('verify-token', '042917'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(otpService.verifyChallenge).not.toHaveBeenCalled();
    });

    it('rejects a token signed for anything other than an OTP challenge', async () => {
      incomingToken(ACCESS_TOKEN_TYPE);
      await expect(
        service.verifyOtp('access-token', '042917'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a tampered or expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));
      await expect(
        service.verifyOtp('garbage', '042917'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('resendOtp', () => {
    it('emails the rotated code and returns a new challenge token', async () => {
      const result = await service.resendOtp('otp-token');

      expect(otpService.rotateChallenge).toHaveBeenCalledWith(
        'challenge-1',
        OTP_TOKEN_TYPE,
      );
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        USER.email,
        '111111',
        300,
        OTP_TOKEN_TYPE,
      );
      expect(result.otpToken).toBe('signed-token');
    });
  });

  // ---------------------------------------------------------------------------

  describe('forgotPassword', () => {
    it('emails a password_reset code to a real account', async () => {
      await service.forgotPassword(USER.email);

      expect(otpService.createChallenge).toHaveBeenCalledWith(
        7,
        USER.email,
        PASSWORD_RESET_TOKEN_TYPE,
      );
      expect(mailService.sendOtp).toHaveBeenCalledWith(
        USER.email,
        '042917',
        300,
        PASSWORD_RESET_TOKEN_TYPE,
      );
    });

    it('answers an unknown address identically, but sends nothing', async () => {
      const known = await service.forgotPassword(USER.email);
      mailService.sendOtp.mockClear();

      usersService.findOneByEmailForAuth.mockResolvedValue(null);
      const unknown = await service.forgotPassword(USER.email);

      expect(Object.keys(unknown).sort()).toEqual(Object.keys(known).sort());
      expect(unknown).toEqual(known);
      expect(mailService.sendOtp).not.toHaveBeenCalled();
    });

    it('still burns a real Redis challenge for an unknown address', async () => {
      usersService.findOneByEmailForAuth.mockResolvedValue(null);
      await service.forgotPassword('nobody@example.com');

      // Same cooldown and same "Invalid code" on a wrong guess as a real account.
      expect(otpService.createChallenge).toHaveBeenCalledWith(
        0,
        'nobody@example.com',
        PASSWORD_RESET_TOKEN_TYPE,
      );
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => incomingToken(PASSWORD_RESET_TOKEN_TYPE));

    it('hashes the new password and writes only the hash column', async () => {
      const result = await service.resetPassword(
        'token',
        '042917',
        'newpass123',
      );

      expect(otpService.verifyChallenge).toHaveBeenCalledWith(
        'challenge-1',
        '042917',
        PASSWORD_RESET_TOKEN_TYPE,
      );
      expect(hash).toHaveBeenCalledWith('newpass123', 10);
      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
        7,
        'new-hash',
      );
      expect(result.passwordReset).toBe(true);
    });

    it('refuses a login otpToken', async () => {
      incomingToken(OTP_TOKEN_TYPE);
      await expect(
        service.resetPassword('login-token', '042917', 'newpass123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.updatePasswordHash).not.toHaveBeenCalled();
    });

    it('refuses an email_verify token', async () => {
      incomingToken(EMAIL_VERIFY_TOKEN_TYPE);
      await expect(
        service.resetPassword('verify-token', '042917', 'newpass123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('fails indistinguishably when the challenge was a decoy', async () => {
      usersService.findOne.mockResolvedValue(null);
      await expect(
        service.resetPassword('token', '042917', 'newpass123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.updatePasswordHash).not.toHaveBeenCalled();
    });
  });
});
