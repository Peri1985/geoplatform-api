import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  type CreatePlace,
  CreatePlaceSchema,
  type NearbyQuery,
  NearbyQuerySchema,
  type UpdatePlace,
  UpdatePlaceSchema,
} from '@repo/shared';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { Place } from './place.entity.js';
import { PlacesService } from './places.service.js';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  findAll(): Promise<Place[]> {
    return this.placesService.findAll();
  }

  // GET /api/places/nearby?lat=37.94&lon=23.64&radius=500
  @Get('nearby')
  findNearby(
    @Query(new ZodValidationPipe(NearbyQuerySchema)) query: NearbyQuery,
  ): Promise<Place[]> {
    return this.placesService.findNearby(query);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(CreatePlaceSchema)) body: CreatePlace,
    @CurrentUser() user: AuthUser,
  ): Promise<Place> {
    return this.placesService.create(body, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdatePlaceSchema)) body: UpdatePlace,
    @CurrentUser() user: AuthUser,
  ): Promise<Place> {
    return this.placesService.update(id, body, user);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.placesService.remove(id, user);
  }
}
