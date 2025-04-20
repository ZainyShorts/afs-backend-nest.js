import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, raw, urlencoded } from 'express';
import { ensureUploadsFolder } from 'utils/methods/methods';

dotenv.config();

async function bootstrap() {
  ensureUploadsFolder();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use('/webhook', raw({ type: 'application/json' }));

  // 🟢 Regular body parser for other routes
  app.use(json());
  app.use(urlencoded({ extended: true }));

  await app.listen(3013);
}
bootstrap();
