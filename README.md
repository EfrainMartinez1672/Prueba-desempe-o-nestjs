# Prueba-desempe-o-nestjs

Base de API con NestJS, TypeScript, PostgreSQL, TypeORM y Redis.

## Requisitos

- Node.js 20 o superior y npm.
- Docker con el complemento Compose (opcional, para iniciar PostgreSQL y Redis localmente).

## Inicio rápido

1. Copia `.env.example` a `.env` y sustituye los secretos de autenticación por dos valores aleatorios distintos de al menos 32 caracteres.
2. Ejecuta `docker compose up -d --build` para iniciar la API, PostgreSQL y Redis.
3. Abre `http://localhost:3000/api/v2/docs` para Swagger y `http://localhost:3000/api/v2/health` para comprobar la API.

Compose publica el contenedor de la API en el puerto indicado por `PORT` (por defecto `3000`) y configura internamente `DB_HOST=postgres` y `REDIS_HOST=redis`. Si prefieres ejecutar la API fuera de Docker, usa `npm install` y `npm run start:dev`; en ese caso, inicia solo los servicios de datos con `docker compose up -d postgres redis`.

No subas `.env` ni secretos reales al repositorio. La configuración de TypeORM mantiene `synchronize` desactivado; usa migraciones para modificar el esquema.

## Estructura

- `src/modules/`: funcionalidades del negocio; está vacío deliberadamente para que agregues tus propios módulos.
- `src/modules/vehicles/`: CRUD administrativo de vehículos, con eliminación lógica y restauración.
- `src/modules/workshops/`: gestión de talleres y validación de talleres activos para asignar mantenimientos.
- `src/infrastructure/`: integraciones técnicas, conexión de base de datos, migraciones, Redis, health check y web.
- `src/shared/`: código reutilizable entre módulos.
- `src/config/`: configuración y validación de variables de entorno.
- `test/e2e/`: pruebas de extremo a extremo.
- `auth/`: código que ya existía en el repositorio; se conserva sin mover ni integrar automáticamente.

## Comandos

- `npm run build`: compila la aplicación.
- `npm run test`: ejecuta pruebas unitarias.
- `npm run test:e2e`: ejecuta pruebas e2e.
- `npm run migration:generate -- src/infrastructure/database/migrations/NombreMigracion`: genera una migración comparando entidades y base de datos.
- `npm run migration:run`: aplica migraciones pendientes.
- `npm run migration:revert`: revierte la última migración.

El CRUD de vehículos está documentado en [src/docs/vehicles-crud.md](src/docs/vehicles-crud.md). Ejecuta `npm run migration:run` para crear su tabla antes de usar `/vehicles`.

La conexión para la API usa `DB_*`; el servicio de Redis usa `REDIS_*`. Para ejecutar la API dentro de un contenedor, configura `DB_HOST=postgres` y `REDIS_HOST=redis`.
