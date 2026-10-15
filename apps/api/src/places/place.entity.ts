import type { Point } from 'geojson';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
