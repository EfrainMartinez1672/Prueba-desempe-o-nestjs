# Prueba-NodeJS

API REST para administrar usuarios, vehículos, talleres y mantenimientos. Está construida con NestJS y TypeScript; utiliza PostgreSQL con TypeORM, Redis para sesiones y JWT en cookies HttpOnly. Swagger documenta los endpoints y permite probarlos desde el mismo origen sin copiar tokens.

## Contenido

- [Requisitos](#requisitos)
- [Configuración inicial](#configuración-inicial)
- [Iniciar con Docker](#iniciar-con-docker)
- [Aplicar migraciones](#aplicar-migraciones)
- [Crear el primer administrador](#crear-el-primer-administrador)
- [Acceder a Swagger e iniciar sesión](#acceder-a-swagger-e-iniciar-sesión)
- [Módulos y reglas principales](#módulos-y-reglas-principales)
- [Desarrollo y pruebas](#desarrollo-y-pruebas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)

## Requisitos

- Node.js 20 o superior y npm.
- Docker Engine/Desktop con Docker Compose.
- Git para clonar el repositorio.

## Configuración inicial

1. Clona el repositorio y entra al directorio del proyecto.
2. Copia `.env.example` como `.env`.
3. Configura las variables antes de iniciar la API:

| Variable         | Uso                                                | Valor local típico                     |
| ---------------- | -------------------------------------------------- | -------------------------------------- |
| `PORT`           | Puerto publicado en el equipo                      | `3000`                                 |
| `API_PREFIX`     | Prefijo de rutas de la API                         | `api/v2`                               |
| `COOKIE_SECURE`  | Requiere HTTPS para cookies                        | `false` en HTTP local; `true` en HTTPS |
| `DB_USERNAME`    | Usuario de PostgreSQL                              | `app`                                  |
| `DB_PASSWORD`    | Contraseña de PostgreSQL                           | Define una propia                      |
| `DB_DATABASE`    | Base de datos                                      | `app_db`                               |
| `REDIS_PASSWORD` | Contraseña de Redis; vacía desactiva autenticación | Opcional en desarrollo                 |
| `JWT_SECRET`     | Secreto de access tokens                           | Aleatorio, mínimo 32 caracteres        |
| `REFRESH_SECRET` | Secreto independiente para refresh tokens          | Aleatorio, mínimo 32 caracteres        |

Genera secretos distintos para JWT y refresh. No uses los valores de ejemplo en producción, no compartas el archivo `.env` y no subas secretos al repositorio.

> En Docker Compose, la API se conecta internamente a PostgreSQL y Redis mediante los nombres de servicio `postgres` y `redis`. No cambies `DB_HOST` ni `REDIS_HOST` a `localhost` dentro de la configuración del contenedor.

## Iniciar con Docker

Desde la raíz del proyecto:

```sh
docker compose up -d --build
```

Compose inicia la API, PostgreSQL y Redis. Comprueba los contenedores con:

```sh
docker compose ps
```

La API escucha en `http://localhost:${PORT}`. Con los valores por defecto:

- Swagger UI: `http://localhost:3000/api/v2/docs`
- Documento OpenAPI JSON: `http://localhost:3000/api/v2/docs-json`
- Health check: `http://localhost:3000/api/v2/health`

Si modificas `API_PREFIX` o `PORT`, actualiza las direcciones con esos valores.

## Aplicar migraciones

TypeORM mantiene `synchronize` desactivado; por tanto, las tablas no se crean automáticamente al arrancar. Instala las dependencias de desarrollo en el equipo si todavía no lo hiciste y ejecuta las migraciones desde la raíz:

```sh
npm install
npm run migration:run
```

El archivo `.env` debe apuntar al PostgreSQL local publicado por Compose (`DB_HOST=localhost` y el `DB_PORT` configurado). La migración crea las tablas de usuarios, vehículos, talleres y mantenimientos, sus relaciones e índices. Las migraciones posteriores agregan estados de usuario/taller, fin programado de mantenimiento y prevención de cruces de horario.

Comandos de migración disponibles:

```sh
npm run migration:run
npm run migration:revert
npm run migration:generate -- src/infrastructure/database/migrations/NombreMigracion
```

`migration:revert` revierte solo la última migración; úsalo con cuidado y únicamente cuando corresponda.

## Crear el primer administrador

La creación de cuentas está protegida: solo un administrador puede usar `POST /users`, y no hay registro público. Para preparar el primer acceso, crea un hash bcrypt en un entorno local confiable (coste 12) y guárdalo temporalmente; no guardes la contraseña ni el hash en código o Git. Después de aplicar las migraciones, ejecuta en PostgreSQL una inserción con tus propios valores:

```sql
INSERT INTO users (name, email, password_hash, role, status)
VALUES ('Initial Administrator', 'admin@example.com', '<BCRYPT_HASH_GENERATED_LOCALLY>', 'ADMIN', 'ACTIVE');
```

El campo `password_hash` debe contener el hash bcrypt completo, no la contraseña en texto plano. El administrador no necesita fila en `technician_profiles`. Si ya existe un administrador activo, no es necesario insertar otro; inicia sesión con sus credenciales.

## Acceder a Swagger e iniciar sesión

1. Abre Swagger UI.
2. Ejecuta `POST /auth/login` con el correo y la contraseña de un usuario activo.
3. Si son válidos, el servidor devuelve el perfil y establece las cookies HttpOnly `accessToken` y `refreshToken`.
4. Swagger, abierto en el mismo origen, envía las cookies automáticamente. No se debe usar **Authorize** ni copiar tokens.
5. Ejecuta los endpoints administrativos protegidos.
6. Usa `POST /auth/refresh-token` para renovar las cookies y `POST /auth/logout` para cerrar la sesión.

En desarrollo por HTTP, configura `COOKIE_SECURE=false`. En un despliegue HTTPS, usa `COOKIE_SECURE=true`. Un usuario `INACTIVE` no puede iniciar sesión, renovar la sesión ni usar una cookie de acceso existente.

## Módulos y reglas principales

### Autenticación y usuarios

- `POST /auth/login`, `POST /auth/refresh-token`, `GET /auth/me`, `POST /auth/logout`.
- `POST /users` crea usuarios; solo lo puede hacer un administrador.
- Los roles son `ADMIN` y `TECHNICIAN`; el estado es `ACTIVE` o `INACTIVE`.
- `PATCH /users/:id/status` activa o inactiva una cuenta. Los usuarios inactivos permanecen en la base y visibles para el administrador.
- Los técnicos tienen especialidad; las contraseñas se guardan usando bcrypt.

### Vehículos

- CRUD administrativo en `/vehicles`, búsqueda por identificador y eliminación/restauración lógica.
- Los estados son `AVAILABLE`, `IN_MAINTENANCE` e `INACTIVE`.
- La placa se normaliza a mayúsculas y no puede duplicarse entre vehículos activos.

### Talleres

- `POST /workshops`, `GET /workshops`, `GET /workshops/:id` y `PATCH /workshops/:id/status`.
- Los estados son `ACTIVE` e `INACTIVE`; el listado general devuelve solo talleres activos.
- Los mantenimientos nuevos solo pueden asignarse a talleres activos. Inactivar un taller no borra los mantenimientos ni su historial.

### Mantenimientos

- `POST /maintenances` programa; `GET /maintenances` lista todos y `GET /maintenances/active` lista `SCHEDULED` e `IN_PROGRESS`.
- También hay consultas por ID, por vehículo, por mecánico e historial completo del vehículo.
- Cada mantenimiento relaciona vehículo, técnico y taller activos. El kilometraje programado no puede ser menor al odómetro del vehículo.
- Los tipos son `PREVENTIVE` y `CORRECTIVE`. Los estados son `SCHEDULED`, `IN_PROGRESS`, `COMPLETED` y `CANCELLED`.
- Debe incluir `scheduledAt` y `scheduledEndAt`. El fin debe ser posterior al inicio. Un técnico no puede tener dos mantenimientos activos con intervalos superpuestos; los turnos contiguos sí se permiten.
- `COMPLETED` y `CANCELLED` son estados terminales. Para completar, hay que registrar trabajo realizado, costo final, fecha real de finalización y kilometraje final.
- Inactivar un vehículo o técnico no elimina sus mantenimientos ni impide consultar el historial existente. Sí impide nuevas asignaciones.

Los ejemplos de payloads y respuestas están en la documentación detallada de [usuarios](src/docs/users-crud.md), [vehículos](src/docs/vehicles-crud.md), [talleres](src/docs/workshops-crud.md), [mantenimientos](src/docs/maintenances-crud.md) y [autenticación de Swagger](src/docs/swagger-cookie-auth.md).

## Desarrollo y pruebas

Para correr solo PostgreSQL y Redis en Docker y ejecutar la API desde el equipo:

```sh
docker compose up -d postgres redis
npm install
npm run migration:run
npm run start:dev
```

Comandos útiles:

| Comando              | Descripción                            |
| -------------------- | -------------------------------------- |
| `npm run start:dev`  | Inicia NestJS en modo watch.           |
| `npm run build`      | Compila a `dist/`.                     |
| `npm run start:prod` | Inicia la compilación de producción.   |
| `npm run lint`       | Ejecuta ESLint.                        |
| `npm test`           | Ejecuta las pruebas unitarias.         |
| `npm run test:watch` | Ejecuta las pruebas en modo watch.     |
| `npm run test:cov`   | Ejecuta pruebas con cobertura.         |
| `npm run test:e2e`   | Ejecuta la suite de extremo a extremo. |

Para ver logs o detener los contenedores:

```sh
docker compose logs -f api
docker compose down
```

`docker compose down` conserva los datos de volúmenes. No uses `docker compose down -v` salvo que quieras eliminar permanentemente la base local.

## Estructura del proyecto

```text
src/
├── config/                 # Configuración de base de datos y Swagger
├── infrastructure/
│   ├── database/           # DataSource y migraciones TypeORM
│   ├── health/             # Health check
│   └── redis/              # Sesiones y revocación de tokens
├── modules/
│   ├── auth/               # Login, refresh, logout y guards
│   ├── users/              # Usuarios, roles y perfiles de técnico
│   ├── vehicles/           # Flota y eliminación/restauración lógica
│   ├── workshops/          # Talleres y disponibilidad
│   └── maintenances/       # Agenda, historial y cierre de trabajos
├── shared/                 # Espacio para utilidades compartidas
└── docs/                   # Guías de API y reglas de negocio
```

## Solución de problemas

- **Swagger muestra `401`:** inicia sesión desde `POST /auth/login`, comprueba que las cookies estén habilitadas y que Swagger y la API usen el mismo host, esquema y puerto.
- **La cookie no se envía por HTTP:** usa `COOKIE_SECURE=false` para desarrollo local; usa `true` solo sobre HTTPS.
- **Error `relation does not exist`:** ejecuta `npm run migration:run` y confirma que `.env` apunta a la misma base que usa la API.
- **Error al asignar mantenimiento:** verifica que vehículo, técnico y taller estén activos, que el usuario tenga rol `TECHNICIAN`, que el kilometraje sea válido y que el horario no se cruce con otro del mismo técnico.
- **Diagnóstico de contenedores:** revisa `docker compose ps` y `docker compose logs -f api postgres redis`.
