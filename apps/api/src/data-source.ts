// Entry point for the TypeORM CLI (migration:generate, migration:run, ...).
import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database/database.config.js';

if (existsSync('.env')) process.loadEnvFile('.env');

export default new DataSource(databaseOptions());
