import type { DataSourceOptions } from 'typeorm';
import { Place } from '../places/place.entity.js';

// Shared by the Nest app (app.module.ts) and the TypeORM CLI (data-source.ts).
export function databaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'geoplatform',
    password: process.env.DB_PASSWORD ?? 'geoplatform',
    database: process.env.DB_NAME ?? 'geoplatform',
    // gen_random_uuid() is built into Postgres 13+, no uuid-ossp extension needed
    uuidExtension: 'pgcrypto',
    entities: [Place],
    // Compiled migrations; the CLI and the app both run from dist/
    migrations: [new URL('../migrations/*.js', import.meta.url).pathname],
    // The schema changes only through migrations
    synchronize: false,
  };
}
