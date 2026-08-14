import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const contextWith = (
  sub: unknown,
  roles: string[] | undefined,
): ExecutionContext => {
  const request = { user: sub === undefined ? undefined : { sub } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    __roles: roles,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  const findOne = jest.fn();
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector, { findOne } as never);

  beforeEach(() => {
    findOne.mockReset();
    (reflector.getAllAndOverride as jest.Mock).mockReset();
  });

  it('allows the route through when no @Roles() is set', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    await expect(guard.canActivate(contextWith(1, undefined))).resolves.toBe(
      true,
    );
    expect(findOne).not.toHaveBeenCalled();
  });

  it('allows a user whose role is in the required list', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    findOne.mockResolvedValue({ id: 1, role: 'admin' });
    await expect(guard.canActivate(contextWith(1, ['admin']))).resolves.toBe(
      true,
    );
  });

  it('rejects a customer on an admin-only route', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    findOne.mockResolvedValue({ id: 2, role: 'customer' });
    await expect(
      guard.canActivate(contextWith(2, ['admin'])),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when there is no authenticated user on the request', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    await expect(
      guard.canActivate(contextWith(undefined, ['admin'])),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findOne).not.toHaveBeenCalled();
  });
});
