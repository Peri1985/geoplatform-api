import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import {
  type Login,
  LoginSchema,
  type RefreshToken,
  RefreshTokenSchema,
  type Register,
  RegisterSchema,
  type Tokens,
  type User as UserDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { toUserDto, UsersService } from '../users/users.service.js';
import type { AuthUser } from './auth-user.js';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public } from './decorators.js';
import { TokensService } from './tokens.service.js';

// Rate-limited per IP (see AuthModule) against password guessing
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) body: Register,
  ): Promise<UserDto> {
    return toUserDto(await this.authService.register(body));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(LoginSchema)) body: Login,
  ): Promise<Tokens> {
    return this.authService.login(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshToken,
  ): Promise<Tokens> {
    return this.tokensService.rotate(body.refreshToken);
  }

  // Public so that a client with an expired access token can still log out
  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshToken,
  ): Promise<void> {
    return this.tokensService.revoke(body.refreshToken);
  }

  @SkipThrottle()
  @Get('me')
  async me(@CurrentUser() current: AuthUser): Promise<UserDto> {
    const user = await this.usersService.findById(current.id);
    if (!user) throw new UnauthorizedException();
    return toUserDto(user);
  }
}
