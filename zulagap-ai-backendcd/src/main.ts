import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  // CORS 허용 (모든 도메인 허용 예시)
  app.enableCors({
    origin: ['http://localhost:3001'], // 프론트엔드 주소!
    credentials: true,
  });

  // bodyParser limit 늘리기 (express 사용)
  // app.use(express.json({ limit: '10mb' }));
  // app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('ZulaGap-AI API')
    .setDescription('ZulaGap-AI 서비스 API 문서')
    .setVersion('1.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 포트를 3000으로 고정
  await app.listen(3000);
}
bootstrap();
