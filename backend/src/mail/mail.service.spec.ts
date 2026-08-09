import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MailService } from './mail.service';
import {
  EMAIL_VERIFY_TOKEN_TYPE,
  OTP_TOKEN_TYPE,
  PASSWORD_RESET_TOKEN_TYPE,
  type OtpPurpose,
} from 'src/auth/otp.constants';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const SMTP_CONFIG: Record<string, string> = {
  MAIL_TRANSPORT: 'smtp',
  MAIL_HOST: 'smtp.gmail.com',
  MAIL_PORT: '465',
  MAIL_SECURE: 'true',
  MAIL_USER: 'sender@gmail.com',
  MAIL_PASSWORD: 'qzut lkth idjj dxbe',
  MAIL_FROM: 'RUMO <sender@gmail.com>',
};

const buildService = async (config: Record<string, string>) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MailService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, fallback?: unknown) => config[key] ?? fallback,
          getOrThrow: (key: string) => config[key],
        },
      },
    ],
  }).compile();
  return module.get<MailService>(MailService);
};

describe('MailService', () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  describe('smtp transport', () => {
    it('configures Gmail on implicit TLS and strips App Password spaces', async () => {
      await buildService(SMTP_CONFIG);

      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: 'sender@gmail.com', pass: 'qzutlkthidjjdxbe' },
        }),
      );
    });

    it('sends the code to the requested address', async () => {
      const service = await buildService(SMTP_CONFIG);
      await service.sendOtp('user@example.com', '042917', 300);

      const sent = sendMail.mock.calls[0][0] as Record<string, string>;
      expect(sent.to).toBe('user@example.com');
      expect(sent.from).toBe('RUMO <sender@gmail.com>');
      expect(sent.text).toContain('042917');
    });
  });

  describe('per-flow copy', () => {
    const sentFor = async (purpose: OtpPurpose) => {
      sendMail.mockClear();
      const service = await buildService(SMTP_CONFIG);
      await service.sendOtp('user@example.com', '042917', 300, purpose);
      return sendMail.mock.calls[0][0] as Record<string, string>;
    };

    it('gives each flow its own subject', async () => {
      const login = await sentFor(OTP_TOKEN_TYPE);
      const verify = await sentFor(EMAIL_VERIFY_TOKEN_TYPE);
      const reset = await sentFor(PASSWORD_RESET_TOKEN_TYPE);

      expect(verify.subject).toContain('ยืนยันอีเมล');
      expect(reset.subject).toContain('รีเซ็ตรหัสผ่าน');
      expect(new Set([login.subject, verify.subject, reset.subject]).size).toBe(
        3,
      );
    });

    it('carries the code and the validity window in every flow', async () => {
      for (const purpose of [
        OTP_TOKEN_TYPE,
        EMAIL_VERIFY_TOKEN_TYPE,
        PASSWORD_RESET_TOKEN_TYPE,
      ] as const) {
        const sent = await sentFor(purpose);
        expect(sent.text).toContain('042917');
        expect(sent.html).toContain('042917');
        expect(sent.text).toContain('5 นาที');
      }
    });

    it('defaults to the login copy when no purpose is given', async () => {
      sendMail.mockClear();
      const service = await buildService(SMTP_CONFIG);
      await service.sendOtp('user@example.com', '042917', 300);
      const sent = sendMail.mock.calls[0][0] as Record<string, string>;

      const login = await sentFor(OTP_TOKEN_TYPE);
      expect(sent.subject).toBe(login.subject);
    });
  });

  describe('log transport', () => {
    it('never builds a transporter', async () => {
      await buildService({ MAIL_TRANSPORT: 'log' });
      expect(createTransport).not.toHaveBeenCalled();
    });

    it('does not attempt to send', async () => {
      const service = await buildService({ MAIL_TRANSPORT: 'log' });
      await service.sendOtp('user@example.com', '042917', 300);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('refuses to start in production', async () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(buildService({ MAIL_TRANSPORT: 'log' })).rejects.toThrow(
          /forbidden in production/,
        );
      } finally {
        process.env.NODE_ENV = previous;
      }
    });
  });
});
