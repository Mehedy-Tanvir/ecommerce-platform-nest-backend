import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Project description
  app.setGlobalPrefix('api/v1');

  // set global validation pipe
  app.useGlobalPipes(
    new (await import('@nestjs/common')).ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // enable cors
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // enable swagger docs
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints related to user authentication')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Refresh-JWT',
        description:
          'Enter your refresh JWT token in the format: Bearer <token>',
        in: 'header',
      },
      'Refresh-JWT-auth',
    )
    .addServer('http://localhost:3000', 'Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Documentation',
    customfavIcon: 'https://nestjs.com/img/favicon.ico',
    customCss: `
    .swagger-ui .topbar {display: none;}
    .swagger-ui .info {margin: 50px 0;}
    .swagger-ui .info .title {color: #4A90E2;}`,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  Logger.error('Error starting the application:', error);
  process.exit(1);
});
