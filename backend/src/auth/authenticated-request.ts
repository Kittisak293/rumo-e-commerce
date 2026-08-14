import { Request } from 'express';

/**
 * What `AuthGuard` puts on the request after verifying an access token —
 * the JWT payload minted in `AuthService` (`{ sub, email, typ }`).
 *
 * Controllers behind `AuthGuard` should annotate `@Request()` with this
 * instead of `any`, so `req.user.sub` reads as the `number` it is.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    typ: string;
  };
}
