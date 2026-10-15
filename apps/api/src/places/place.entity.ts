import type { Point } from 'geojson';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('places')
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  // WGS84 point; TypeORM reads and writes it as GeoJSON
  @Index({ spatial: true })
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location: Point;

  // The owner; only they (or an admin) can change the place. Null if the user was deleted
  @Index()
  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
