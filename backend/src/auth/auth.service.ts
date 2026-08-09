import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { OtpService, type OtpChallenge } from './otp.service';
import {
  ACCESS_TOKEN_TYPE,
  EMAIL_VERIFY_TOKEN_TYPE,
  OTP_TOKEN_TYPE,
  PASSWORD_RESET_TOKEN_TYPE,
  type OtpChallengePayload,
  type OtpPurpose,
} from './otp.constants';
import { RegisterDto } from './dto/register.dto';

export interface OtpChallengeResponse {
  otpToken: string;
  expiresIn: number;
  /** Masked so the UI can say where the code went without echoing the address. */
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Compared against when no user exists so that "unknown email" costs the same
   * ~100ms as "wrong password". Without it, response timing is an enumeration
   * oracle even when the status codes match.
   */
  private static readonly DUMMY_HASH =
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private mailService: MailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Registration + email verification
  // ---------------------------------------------------------------------------

  /**
   * Creates the account in an unverified state and immediately issues an
   * email_verify challenge. The account cannot log in until it is verified.
   */
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findOneByEmailForAuth(dto.email);
    if (existing) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const created = await this.usersService.create(dto);
    const challenge = await this.otpService.createChallenge(
      created.id,
      created.email,
      EMAIL_VERIFY_TOKEN_TYPE,
    );
    await this.deliver(created.email, challenge, EMAIL_VERIFY_TOKEN_TYPE);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...user } = created;
    return {
      user,
      ...(await this.challengeResponse(
        challenge,
        EMAIL_VERIFY_TOKEN_TYPE,
        created.email,
      )),
    };
  }

  /** Proves control of the address. Deliberately does not sign anybody in. */
  async verifyEmail(otpToken: string, code: string) {
    const { jti } = await this.readOtpToken(otpToken, EMAIL_VERIFY_TOKEN_TYPE);
    const { userId, email } = await this.otpService.verifyChallenge(
      jti,
      code,
      EMAIL_VERIFY_TOKEN_TYPE,
    );

    await this.usersService.markEmailVerified(userId);
    return { emailVerified: true, email: maskEmail(email) };
  }

  async resendVerification(otpToken: string): Promise<OtpChallengeResponse> {
    const { jti } = await this.readOtpToken(otpToken, EMAIL_VERIFY_TOKEN_TYPE);
    const challenge = await this.otpService.rotateChallenge(
      jti,
      EMAIL_VERIFY_TOKEN_TYPE,
    );
    await this.deliver(challenge.email, challenge, EMAIL_VERIFY_TOKEN_TYPE);
    return this.challengeResponse(
      challenge,
      EMAIL_VERIFY_TOKEN_TYPE,
      challenge.email,
    );
  }

  // ---------------------------------------------------------------------------
  // Login (password + OTP second factor)
  // ---------------------------------------------------------------------------

  /**
   * First factor. A correct password does not sign anybody in — it only earns a
   * claim check pointing at a server-side OTP challenge.
   */
  async startLogin(email: string, pass: string): Promise<OtpChallengeResponse> {
    const user = await this.usersService.findOneByEmailForAuth(email);
    const isMatch = await bcrypt.compare(
      pass,
      user?.passwordHash ?? AuthService.DUMMY_HASH,
    );

    // One message, one status, one timing profile for both failure modes.
    if (!user || !isMatch) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // Checked only AFTER the password, so the account-state hint is revealed
    // solely to someone who already proved they hold the credentials. Gating on
    // it earlier would turn this endpoint back into an enumeration oracle.
    if (!user.emailVerified) {
      throw await this.emailVerificationRequired(user.id, user.email);
    }

    const challenge = await this.otpService.createChallenge(
      user.id,
      user.email,
      OTP_TOKEN_TYPE,
    );
    await this.deliver(user.email, challenge, OTP_TOKEN_TYPE);
    return this.challengeResponse(challenge, OTP_TOKEN_TYPE, user.email);
  }

  /** Second factor. Only this path ever mints a real access token. */
  async verifyOtp(otpToken: string, code: string) {
    const { jti } = await this.readOtpToken(otpToken, OTP_TOKEN_TYPE);
    const { userId } = await this.otpService.verifyChallenge(
      jti,
      code,
      OTP_TOKEN_TYPE,
    );

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      typ: ACCESS_TOKEN_TYPE,
    };
    return {
      user,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async resendOtp(otpToken: string): Promise<OtpChallengeResponse> {
    const { jti } = await this.readOtpToken(otpToken, OTP_TOKEN_TYPE);
    const challenge = await this.otpService.rotateChallenge(
      jti,
      OTP_TOKEN_TYPE,
    );
    await this.deliver(challenge.email, challenge, OTP_TOKEN_TYPE);
    return this.challengeResponse(
      challenge,
      OTP_TOKEN_TYPE,
      challenge.email,
    );
  }

  // ---------------------------------------------------------------------------
  // Forgot / reset password
  // ---------------------------------------------------------------------------

  /**
   * Identical response whether or not the address exists.
   *
   * Unknown addresses still get a real Redis challenge — one nobody is emailed.
   * That keeps every observable the same: status, body shape, the resend
   * cooldown, and "Invalid code" rather than "expired" on a wrong guess. A
   * decoy that skipped Redis would leak all four.
   */
  async forgotPassword(email: string): Promise<OtpChallengeResponse> {
    const user = await this.usersService.findOneByEmailForAuth(email);

    const challenge = await this.otpService.createChallenge(
      user?.id ?? 0,
      email,
      PASSWORD_RESET_TOKEN_TYPE,
    );
    if (user) {
      await this.deliver(user.email, challenge, PASSWORD_RESET_TOKEN_TYPE);
    }

    return this.challengeResponse(challenge, PASSWORD_RESET_TOKEN_TYPE, email);
  }

  async resetPassword(otpToken: string, code: string, newPassword: string) {
    const { jti } = await this.readOtpToken(
      otpToken,
      PASSWORD_RESET_TOKEN_TYPE,
    );
    const { userId } = await this.otpService.verifyChallenge(
      jti,
      code,
      PASSWORD_RESET_TOKEN_TYPE,
    );

    const user = await this.usersService.findOne(userId);
    if (!user) {
      // Only reachable by guessing the code of a decoy challenge. Same error as
      // any other dead challenge, so it stays indistinguishable.
      throw new UnauthorizedException('Code expired or already used');
    }

    await this.usersService.updatePasswordHash(
      userId,
      await bcrypt.hash(newPassword, 10),
    );
    return { passwordReset: true };
  }

  // ---------------------------------------------------------------------------
  // Shared plumbing
  // ---------------------------------------------------------------------------

  /**
   * Builds the 403 for an unverified account, bundling a fresh verification
   * challenge so the client can jump straight to the code screen. If the resend
   * cooldown is still held, the previous code is still valid — say so instead of
   * failing the request with a 429 the user cannot act on.
   */
  private async emailVerificationRequired(
    userId: number,
    email: string,
  ): Promise<ForbiddenException> {
    const body = {
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      emailVerificationRequired: true,
      message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
    };

    try {
      const challenge = await this.otpService.createChallenge(
        userId,
        email,
        EMAIL_VERIFY_TOKEN_TYPE,
      );
      await this.deliver(email, challenge, EMAIL_VERIFY_TOKEN_TYPE);
      return new ForbiddenException({
        ...body,
        ...(await this.challengeResponse(
          challenge,
          EMAIL_VERIFY_TOKEN_TYPE,
          email,
        )),
      });
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === 429) {
        return new ForbiddenException({
          ...body,
          message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (เพิ่งส่งรหัสไปให้แล้ว)',
        });
      }
      throw e;
    }
  }

  private async challengeResponse(
    challenge: OtpChallenge,
    purpose: OtpPurpose,
    email: string,
  ): Promise<OtpChallengeResponse> {
    return {
      otpToken: await this.signOtpToken(challenge.jti, challenge.ttl, purpose),
      expiresIn: challenge.ttl,
      email: maskEmail(email),
    };
  }

  /**
   * The challenge token carries no sub, no email and no role — only a pointer
   * and the flow it belongs to. Everything that matters stays in Redis, so
   * deleting the key revokes it.
   */
  private signOtpToken(
    jti: string,
    ttl: number,
    purpose: OtpPurpose,
  ): Promise<string> {
    const payload: OtpChallengePayload = { jti, typ: purpose };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('OTP_JWT_SECRET'),
      expiresIn: ttl,
    });
  }

  private async readOtpToken(
    token: string,
    expected: OtpPurpose,
  ): Promise<OtpChallengePayload> {
    let payload: OtpChallengePayload;
    try {
      payload = await this.jwtService.verifyAsync<OtpChallengePayload>(token, {
        secret: this.configService.getOrThrow<string>('OTP_JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
    // All three flows share one secret, so this claim check is what keeps a
    // password_reset token from being spent on verify-email and vice versa.
    if (payload?.typ !== expected || !payload.jti) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return payload;
  }

  /**
   * Awaited so a hard SMTP failure is visible, but never fatal to the request:
   * the challenge already exists, and the user can hit resend.
   */
  private async deliver(
    email: string,
    challenge: OtpChallenge,
    purpose: OtpPurpose,
  ): Promise<void> {
    try {
      await this.mailService.sendOtp(
        email,
        challenge.code,
        challenge.ttl,
        purpose,
      );
    } catch (e) {
      this.logger.error(
        `failed to deliver OTP: ${e instanceof Error ? e.message : 'unknown error'}`,
      );
    }
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return '***';
  const head = name.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}
