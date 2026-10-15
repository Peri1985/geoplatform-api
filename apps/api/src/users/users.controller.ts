import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  type UpdateUser,
  UpdateUserSchema,
  type User as UserDto,
} from '@repo/shared';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { toUserDto, UsersService } from './users.service.js';

@Controller('users')
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserDto[]> {
    return (await this.usersService.findAll()).map(toUserDto);
  }

  // Change a user's role or deactivate them; their refresh tokens are revoked
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) body: UpdateUser,
    @CurrentUser() actor: AuthUser,
  ): Promise<UserDto> {
    return toUserDto(await this.usersService.update(id, body, actor.id));
  }
}
