import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreatePlace, NearbyQuery } from '@repo/shared';
import { Repository } from 'typeorm';
import { Place } from './place.entity.js';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place) private readonly places: Repository<Place>,
  ) {}

  findAll(): Promise<Place[]> {
    return this.places.find({ order: { createdAt: 'DESC' } });
  }

  create(data: CreatePlace): Promise<Place> {
    return this.places.save(this.places.create(data));
  }

  // Places within `radius` metres of the point, nearest first
  findNearby({ lat, lon, radius }: NearbyQuery): Promise<Place[]> {
    const point = 'ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography';
    return this.places
      .createQueryBuilder('place')
      .where(`ST_DWithin(place.location::geography, ${point}, :radius)`)
      .orderBy(`ST_Distance(place.location::geography, ${point})`)
      .setParameters({ lat, lon, radius })
      .getMany();
  }
}
