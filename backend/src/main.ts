import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

/**
 * Reusing JWT_SECRET for the OTP challenge token would make an otpToken a valid
 * access token, which defeats the entire second factor. Fail at boot instead.
 */
function assertSecretsAreDistinct() {
  if (process.env.JWT_SECRET === process.env.OTP_JWT_SECRET) {
    throw new Error('OTP_JWT_SECRET must be different from JWT_SECRET');
  }
}

async function bootstrap() {
  assertSecretsAreDistinct();

  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('RUMO API')
    .setDescription('API documentation for my project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:9000',
    credentials: true,
  });
  app.enableShutdownHooks(); // lets RedisModule close its connection on Ctrl+C
  await app.listen(process.env.PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
