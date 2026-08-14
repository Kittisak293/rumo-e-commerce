import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/users/users.service';
import { ROLES_KEY, UserRole } from './roles.decorator';
import { AuthenticatedRequest } from './authenticated-request';

/**
 * Must run *after* `AuthGuard` — it reads the `user` AuthGuard put on the
 * request. Nest runs `@UseGuards(AuthGuard, RolesGuard)` in that order, so
 * always list them that way round.
 *
 * The role is read from the database rather than from the JWT: access tokens
 * already in circulation carry no `role` claim, and adding one would silently
 * treat every existing token as role-less until its holder logged in again.
 * The extra query only happens on routes that opt into `@Roles()`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;
    if (typeof userId !== 'number') {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findOne(userId);
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
