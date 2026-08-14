import { SetMetadata } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

export const ROLES_KEY = 'roles';

export type UserRole = User['role'];

/**
 * Restricts a route (or a whole controller) to the listed roles.
 * Only meaningful together with `AuthGuard` + `RolesGuard`:
 *
 *   `@UseGuards(AuthGuard, RolesGuard) @Roles('admin')`
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
