import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';
import { ensureUploadsFolder } from 'utils/methods/methods';

dotenv.config();

async function bootstrap() {
  ensureUploadsFolder();
  const app = await NestFactory.create(AppModule);
  // Allow all origins (for development)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });

  // 🟢 Regular body parser for other routes
  app.use(json());
  app.use(urlencoded({ extended: true }));

  await app.listen(3013);
}
bootstrap();
