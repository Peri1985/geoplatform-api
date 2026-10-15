import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { databaseOptions } from './database/database.config.js';
import { PlacesModule } from './places/places.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Loads apps/api/.env into process.env
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: databaseOptions }),
    AuthModule,
    UsersModule,
    PlacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
