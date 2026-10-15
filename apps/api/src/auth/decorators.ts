import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '@repo/shared';
import type { AuthenticatedRequest, AuthUser } from './auth-user.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

// Opens an endpoint (or a whole controller) to callers without a token
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Restricts an endpoint (or a whole controller) to the given roles
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// The caller, as read from the access token
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
