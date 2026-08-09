import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

// Nest instantiates @UseGuards enhancers when the module compiles, so they are
// stubbed here. Guard behaviour is covered in auth.guard.spec.ts.
const allow = { canActivate: () => true };

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn().mockResolvedValue({ user: {}, otpToken: 'verify' }),
    verifyEmail: jest.fn().mockResolvedValue({ emailVerified: true }),
    resendVerification: jest.fn().mockResolvedValue({ otpToken: 'verify2' }),
    startLogin: jest.fn().mockResolvedValue({ otpToken: 'otp' }),
    verifyOtp: jest.fn().mockResolvedValue({ access_token: 'jwt' }),
    resendOtp: jest.fn().mockResolvedValue({ otpToken: 'otp2' }),
    forgotPassword: jest.fn().mockResolvedValue({ otpToken: 'reset' }),
    resetPassword: jest.fn().mockResolvedValue({ passwordReset: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue(allow)
      .overrideGuard(AuthGuard)
      .useValue(allow)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('registration and verification', () => {
    it('register creates the account and hands back a verification token', async () => {
      const dto = {
        email: 'new@example.com',
        name: 'New',
        password: 'password123',
        age: 20,
      };
      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).not.toHaveProperty('access_token');
    });

    it('verify-email confirms the address without signing in', async () => {
      const result = await controller.verifyEmail({
        otpToken: 'verify',
        code: '042917',
      });

      expect(authService.verifyEmail).toHaveBeenCalledWith('verify', '042917');
      expect(result).not.toHaveProperty('access_token');
    });

    it('resend-verification rotates the verification code', async () => {
      await controller.resendVerification({ otpToken: 'verify' });
      expect(authService.resendVerification).toHaveBeenCalledWith('verify');
    });
  });

  describe('login', () => {
    it('login starts the challenge instead of issuing a token', async () => {
      const result = await controller.signIn({
        email: 'user@example.com',
        password: 'secret',
      });

      expect(authService.startLogin).toHaveBeenCalledWith(
        'user@example.com',
        'secret',
      );
      expect(result).not.toHaveProperty('access_token');
    });

    it('verify-otp exchanges the challenge for an access token', async () => {
      const result = await controller.verifyOtp({
        otpToken: 'otp',
        code: '042917',
      });

      expect(authService.verifyOtp).toHaveBeenCalledWith('otp', '042917');
      expect(result).toHaveProperty('access_token');
    });

    it('resend-otp rotates the challenge', async () => {
      await controller.resendOtp({ otpToken: 'otp' });
      expect(authService.resendOtp).toHaveBeenCalledWith('otp');
    });
  });

  describe('password reset', () => {
    it('forgot-password takes only the address', async () => {
      await controller.forgotPassword({ email: 'user@example.com' });
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('reset-password passes the code and the new password through', async () => {
      const result = await controller.resetPassword({
        otpToken: 'reset',
        code: '042917',
        newPassword: 'newpass12345',
      });

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'reset',
        '042917',
        'newpass12345',
      );
      expect(result).not.toHaveProperty('access_token');
    });
  });
});
