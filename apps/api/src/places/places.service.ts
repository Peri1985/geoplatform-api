import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreatePlace, NearbyQuery, UpdatePlace } from '@repo/shared';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth/auth-user.js';
import { Place } from './place.entity.js';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place) private readonly places: Repository<Place>,
  ) {}

  findAll(): Promise<Place[]> {
    return this.places.find({ order: { createdAt: 'DESC' } });
  }

  create(data: CreatePlace, owner: AuthUser): Promise<Place> {
    return this.places.save(
      this.places.create({ ...data, createdById: owner.id }),
    );
  }

  async update(id: string, data: UpdatePlace, actor: AuthUser): Promise<Place> {
    const place = await this.findEditable(id, actor);
    Object.assign(place, data);
    return this.places.save(place);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const place = await this.findEditable(id, actor);
    await this.places.remove(place);
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

  // Only the owner or an admin may change a place
  private async findEditable(id: string, actor: AuthUser): Promise<Place> {
    const place = await this.places.findOneBy({ id });
    if (!place) throw new NotFoundException('Place not found');
    if (actor.role !== 'admin' && place.createdById !== actor.id) {
      throw new ForbiddenException('You can only change your own places');
    }
    return place;
  }
}
