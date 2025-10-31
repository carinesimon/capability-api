import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  // on active CORS de façon explicite
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept',
      exposedHeaders: 'Content-Length, Content-Range',
    },
  });

  // JSON pour tout
  app.use(express.json({ limit: '2mb' }));

  // ❗️ Désactiver complètement l’ETag côté Express (évite 304 intempestifs)
  const http = app.getHttpAdapter().getInstance();
  if (http && typeof http.disable === 'function') {
    http.disable('etag');
  }

  // ❗️ Forcer un no-cache par défaut pour les réponses (surtout API)
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
