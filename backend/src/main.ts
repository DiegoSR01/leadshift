import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = (
    process.env.FRONTEND_ORIGINS ||
    'http://localhost:5173,http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowLocalDevOrigins = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = origins.includes(origin);
      const isLocalDevOrigin =
        allowLocalDevOrigins &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isConfiguredOrigin || isLocalDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 LeadShift API running on http://localhost:${port}`);
}
bootstrap();
