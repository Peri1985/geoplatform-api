import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Role, UpdateUser, User as UserDto } from '@repo/shared';
import argon2 from 'argon2';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { RefreshToken } from '../auth/refresh-token.entity.js';
import { User } from './user.entity.js';

// What the api returns for a user: never the password hash
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  findAll(): Promise<User[]> {
    return this.users.find({ order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email: email.toLowerCase() });
  }

  // Includes passwordHash, for checking the password on login
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(data: {
    email: string;
    password: string;
    role: Role;
  }): Promise<User> {
    const user = this.users.create({
      email: data.email.toLowerCase(),
      passwordHash: await argon2.hash(data.password),
      role: data.role,
    });
    try {
      return await this.users.save(user);
    } catch (error) {
      // 23505 = unique_violation on users.email
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  save(user: User): Promise<User> {
    return this.users.save(user);
  }

  async update(id: string, data: UpdateUser, actorId: string): Promise<User> {
    if (id === actorId) {
      throw new BadRequestException(
        'You cannot change your own role or status',
      );
    }
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const losesAccess =
      (data.role !== undefined && data.role !== user.role) ||
      data.isActive === false;
    Object.assign(user, data);
    const saved = await this.users.save(user);
    // The user has to log in again to get a token with the new role
    if (losesAccess) await this.revokeRefreshTokens(id);
    return saved;
  }

  // Logs the user out everywhere; access tokens already issued expire on their own
  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
