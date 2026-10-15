import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, JwtPayload } from './auth-user.js';
import { IS_PUBLIC_KEY } from './decorators.js';

// Registered globally: every endpoint needs a valid Bearer token unless marked @Public()
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }
}
