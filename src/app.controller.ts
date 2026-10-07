import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Public } from '@/shared/presentation/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Verifica se a API está no ar',
    // Rota pública: não exige o token de acesso na documentação.
    security: [],
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
