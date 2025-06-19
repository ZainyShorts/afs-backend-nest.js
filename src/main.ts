import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';
import { ensureUploadsFolder } from 'utils/methods/methods';
import * as cookieParser from 'cookie-parser';
dotenv.config();

async function bootstrap() {
  ensureUploadsFolder();
  const app = await NestFactory.create(AppModule);
  // Allow all origins (for development)
  app.enableCors({
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'https://dashboard-afs.vercel.app',
      'https://afsrealestate.vercel.app',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });

  // 🟢 Regular body parser for other routes
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());
  await app.listen(3013);
}
bootstrap();
