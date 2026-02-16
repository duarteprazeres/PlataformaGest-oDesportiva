import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global Exception Filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global Logging Interceptor
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Enable global validation (class-validator)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    // Enable CORS with credentials
    app.enableCors({
        origin: ['http://localhost:3001', 'http://localhost:3002'], // Frontend URLs
        credentials: true,
    });

    app.use(cookieParser());

    await app.listen(3000);
}
bootstrap();
