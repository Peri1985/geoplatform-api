import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import type { Login, Register, Tokens } from '@repo/shared';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import type { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { TokensService } from './tokens.service.js';

@Injectable()
export class AuthService implements OnModuleInit {
  // Checked when the email does not exist, so both cases take the same time
  private dummyHash: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash(randomBytes(16));
  }

  // Self-registration always creates a plain user
  register(data: Register): Promise<User> {
    return this.usersService.create({ ...data, role: 'user' });
  }

  async login({ email, password }: Login): Promise<Tokens> {
    const user = await this.usersService.findByEmailWithPassword(email);
    const valid = await argon2.verify(
      user?.passwordHash ?? this.dummyHash,
      password,
    );
    // Same answer for unknown email, wrong password and inactive user
    if (!user || !valid || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokensService.issue(user);
  }
}
