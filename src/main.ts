import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { setupSwagger } from './config/swagger.config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prefix = config.get<string>('API_PREFIX', 'api/v2');

  app.setGlobalPrefix(prefix);
  app.use(cookieParser());
  app.enableShutdownHooks();
  app.useGlobalPipes(new ZodValidationPipe());

  setupSwagger(app, prefix);

  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();
