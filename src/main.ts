import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Expense Tracker API')
    .setDescription(
      'A personal finance REST API for tracking expenses, managing budgets and generating financial reports',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'access-token', 
    )
    .addTag('Auth', 'Register, login, refresh token, logout')
    .addTag('Categories', 'Manage expense categories')
    .addTag('Expenses', 'Track expenses and income')
    .addTag('Budgets', 'Set and manage monthly budgets')
    .addTag('Reports', 'Financial reports and dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Server running on http://localhost:${process.env.PORT ?? 3000}/api/v1`,
  );
  console.log(
    `Swagger docs at http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();