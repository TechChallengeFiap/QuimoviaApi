import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('QuimoviaAPI')
    .setDescription('A QuimoviaAPI é uma API REST desenvolvida para o gerenciamento de produtos químicos, oferecendo recursos para cadastro, consulta, atualização e exclusão de produtos e suas respectivas informações.')
    .setVersion('1.0')
    .addTag('Produtos Químicos', 'Operações relacionadas aos produtos químicos')
    .addTag('Cargas Químicas', 'Operações relacionadas as cargas químicas')
    .addTag('Inspeções', 'Operações relacionadas as inspeções')
    .addTag('Documentação das Cargas', 'Operações relacionadas as documentações das cargas')
    .addTag('Operações dos usuários', 'Operações relacionadas as operações dos usuários')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
