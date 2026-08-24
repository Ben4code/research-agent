import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // ── OpenAPI / Scalar docs ───────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Research Agent API')
    .setDescription(
      'AI-powered research platform that allows users to submit complex research questions and receive structured, source-backed reports.\n\n' +
        'The system uses an AI agent to plan research, search for information, evaluate findings, identify gaps, and produce a final report. Temporal provides durable execution so long-running research tasks can survive failures, restarts, and deployments.',
    )
    .setVersion('0.1.0')
    .addTag('Health', 'Service health and status')
    .addTag('Research', 'Research project CRUD and workflow management')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve the OpenAPI JSON at /api/openapi
  SwaggerModule.setup('api/openapi', app, document);

  // Serve Scalar API Reference at /api/docs
  app.use(
    '/api/docs',
    apiReference({
      content: document,
      theme: 'default',
    }),
  );

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Scalar docs at  http://localhost:${port}/api/docs`);
  console.log(`OpenAPI spec at  http://localhost:${port}/api/openapi-json`);
}
bootstrap();
