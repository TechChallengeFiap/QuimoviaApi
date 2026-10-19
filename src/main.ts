import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { DomainExceptionFilter } from './shared/presentation/filters/domain-exception.filter.js';
import { buildSwaggerConfig } from './shared/infrastructure/config/swagger.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new DomainExceptionFilter(httpAdapterHost));

  const config = buildSwaggerConfig();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  // Mantém o token informado em "Authorize" mesmo depois de recarregar a página.
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
