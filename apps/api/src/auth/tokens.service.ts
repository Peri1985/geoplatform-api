import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Tokens } from '@repo/shared';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { authConfig } from '../config/auth.config.js';
import type { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { JwtPayload } from './auth-user.js';
import { RefreshToken } from './refresh-token.entity.js';

const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

// Issues access + refresh tokens, whatever the login method was
@Injectable()
export class TokensService {
  private readonly config = authConfig();

  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async issue(user: Pick<User, 'id' | 'role'>): Promise<Tokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.accessTokenTtl,
    });

    const refreshToken = randomBytes(32).toString('base64url');
    await this.refreshTokens.insert({
      userId: user.id,
      tokenHash: hash(refreshToken),
      expiresAt: new Date(
        Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
      ),
    });

    return {
      tokenType: 'Bearer',
      accessToken,
      expiresIn: this.config.accessTokenTtl,
      refreshToken,
    };
  }

  // Exchanges a refresh token for new tokens; the old one stops working (rotation)
  async rotate(refreshToken: string): Promise<Tokens> {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: hash(refreshToken) },
      relations: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    if (stored.revokedAt) {
      // A used token came back: it was probably stolen, so log the user out everywhere
      await this.usersService.revokeRefreshTokens(stored.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Only one of two concurrent refreshes with the same token can win
    const { affected } = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (affected !== 1) {
      await this.usersService.revokeRefreshTokens(stored.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issue(stored.user);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.refreshTokens.update(
      { tokenHash: hash(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
