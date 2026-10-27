import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, prefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('Prueba Desempeño API')
    .setDescription(
      'REST API for account management and authentication. Sign in with POST /auth/login; the browser stores HttpOnly cookies and sends them automatically to protected endpoints.',
    )
    .setVersion('1.0.0')
    .addTag('auth', 'Login, cookie-based session management, and current user profile.')
    .addTag('users', 'Administrator-only user account management.')
    .addTag('health', 'Application health checks.')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    jsonDocumentUrl: `${prefix}/docs-json`,
    yamlDocumentUrl: `${prefix}/docs-yaml`,
    customSiteTitle: 'Prueba Desempeño API | Swagger',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      docExpansion: 'list',
      displayRequestDuration: true,
      withCredentials: true,
    },
  });
}
