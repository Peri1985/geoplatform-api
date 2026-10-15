import type { Role } from '@repo/shared';
import type { Request } from 'express';

// What the access token says about the caller, set on the request by AuthGuard
export interface AuthUser {
  id: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}

export type AuthenticatedRequest = Request & { user: AuthUser };
