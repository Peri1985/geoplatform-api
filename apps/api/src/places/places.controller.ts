import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  type CreatePlace,
  CreatePlaceSchema,
  type NearbyQuery,
  NearbyQuerySchema,
} from '@repo/shared';
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
  ): Promise<Place> {
    return this.placesService.create(body);
  }
}
