import { Controller, Get } from '@nestjs/common';
import type { Health } from '@repo/shared';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators.js';

@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): Health {
    return { status: 'ok' };
  }
}
