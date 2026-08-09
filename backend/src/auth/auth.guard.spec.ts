import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { ACCESS_TOKEN_TYPE, OTP_TOKEN_TYPE } from './otp.constants';

const contextWith = (authorization?: string): ExecutionContext => {
  const request: Record<string, unknown> = { headers: { authorization } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

describe('AuthGuard', () => {
  const verifyAsync = jest.fn();
  const guard = new AuthGuard(
    { verifyAsync } as never,
    { get: () => 'access-secret' } as never,
  );

  beforeEach(() => verifyAsync.mockReset());

  it('accepts a bearer token carrying typ=access', async () => {
    verifyAsync.mockResolvedValue({ sub: 7, typ: ACCESS_TOKEN_TYPE });
    await expect(guard.canActivate(contextWith('Bearer good'))).resolves.toBe(
      true,
    );
  });

  it('rejects an OTP challenge token even if it somehow verifies', async () => {
    verifyAsync.mockResolvedValue({ jti: 'c1', typ: OTP_TOKEN_TYPE });
    await expect(
      guard.canActivate(contextWith('Bearer otp')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a legacy token with no typ claim', async () => {
    verifyAsync.mockResolvedValue({ sub: 7, email: 'user@example.com' });
    await expect(
      guard.canActivate(contextWith('Bearer legacy')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a request with no Authorization header', async () => {
    await expect(guard.canActivate(contextWith())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyAsync).not.toHaveBeenCalled();
  });
});
