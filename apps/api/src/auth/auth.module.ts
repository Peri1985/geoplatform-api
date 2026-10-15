import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig } from '../config/auth.config.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { RefreshToken } from './refresh-token.entity.js';
import { RolesGuard } from './roles.guard.js';
import { TokensService } from './tokens.service.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: authConfig().jwtSecret,
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    // 10 requests per minute per IP on the auth endpoints
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    // Order matters: AuthGuard sets request.user, RolesGuard reads it
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
