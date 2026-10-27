# Prueba-NodeJS

REST API for managing users, vehicles, workshops, and maintenance records. It is built with NestJS and TypeScript; it uses PostgreSQL with TypeORM, Redis for sessions, and JWT in HttpOnly cookies. Swagger documents the endpoints and lets you test them from the same origin without copying tokens.

# nombre: Efrain Martinez C. clan: nodejs + nestjs AM

## Contents
- Requirements
- Initial setup
- Start with Docker
- Run migrations
- Create the first administrator
- Access Swagger and log in
- Main modules and rules
- Development and testing
- Project structure
- Troubleshooting
## Requirements

- Node.js 20 or later and npm.

- Docker Engine/Desktop with Docker Compose.

- Git to clone the repository.

## Initial setup

1. Clone the repository and enter the project directory.

2. Copia `.env.example` como `.env`.

3. Configure the variables before starting the API:

| Variable         | Purpose                                            | Typical local value                    |

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

## Start with Docker

From the project root:

```sh

docker compose up -d --build

```

Compose starts the API, PostgreSQL, and Redis. Check the containers with:

```sh

docker compose ps

```

La API escucha en `http://localhost:${PORT}`. Con los valores por defecto:

- Swagger UI: `http://localhost:3000/api/v2/docs`

- OpenAPI JSON document: `http://localhost:3000/api/v2/docs-json`

- Health check: `http://localhost:3000/api/v2/health`

Si modificas `API_PREFIX` o `PORT`, actualiza las direcciones con esos valores.

## Run migrations

TypeORM mantiene `synchronize` desactivado; por tanto, las tablas no se crean automáticamente al arrancar. Instala las dependencias de desarrollo en el equipo si todavía no lo hiciste y ejecuta las migraciones desde la raíz:

```sh

npm install

npm run migration:run

```

El archivo `.env` debe apuntar al PostgreSQL local publicado por Compose (`DB_HOST=localhost` y el `DB_PORT` configurado). La migración crea las tablas de usuarios, vehículos, talleres y mantenimientos, sus relaciones e índices. Las migraciones posteriores agregan estados de usuario/taller, fin programado de mantenimiento y prevención de cruces de horario.

Available migration commands:

```sh

npm run migration:run

npm run migration:revert

npm run migration:generate -- src/infrastructure/database/migrations/NombreMigracion

```

`migration:revert` reverts only the last migration; use it carefully and only when appropriate.

## Create the first administrator

La creación de cuentas está protegida: solo un administrador puede usar `POST /users`, y no hay registro público. Para preparar el primer acceso, crea un hash bcrypt en un entorno local confiable (coste 12) y guárdalo temporalmente; no guardes la contraseña ni el hash en código o Git. Después de aplicar las migraciones, ejecuta en PostgreSQL una inserción con tus propios valores:

```sql

INSERT INTO users (name, email, password_hash, role, status)

VALUES ('Initial Administrator', 'admin@example.com', '<BCRYPT_HASH_GENERATED_LOCALLY>', 'ADMIN', 'ACTIVE');

```

El campo `password_hash` debe contener el hash bcrypt completo, no la contraseña en texto plano. El administrador no necesita fila en `technician_profiles`. Si ya existe un administrador activo, no es necesario insertar otro; inicia sesión con sus credenciales.

## Access Swagger and log in

1. Open Swagger UI.

2. Ejecuta `POST /auth/login` con el correo y la contraseña de un usuario activo.

3. Si son válidos, el servidor devuelve el perfil y establece las cookies HttpOnly `accessToken` y `refreshToken`.

4. Swagger, abierto en el mismo origen, envía las cookies automáticamente. No se debe usar **Authorize** ni copiar tokens.

5. Run the protected administrative endpoints.

6. Usa `POST /auth/refresh-token` para renovar las cookies y `POST /auth/logout` para cerrar la sesión.

En desarrollo por HTTP, configura `COOKIE_SECURE=false`. En un despliegue HTTPS, usa `COOKIE_SECURE=true`. Un usuario `INACTIVE` no puede iniciar sesión, renovar la sesión ni usar una cookie de acceso existente.

## Main modules and rules

### Authentication and users

- `POST /auth/login`, `POST /auth/refresh-token`, `GET /auth/me`, `POST /auth/logout`.

- `POST /users` creates users; only an administrator can do this.

- Los roles son `ADMIN` y `TECHNICIAN`; el estado es `ACTIVE` o `INACTIVE`.

- `PATCH /users/:id/status` activates or deactivates an account. Inactive users remain in the database and are visible to the administrator.

- Technicians have a specialty; passwords are stored using bcrypt.

### Vehicles

- CRUD administrativo en `/vehicles`, búsqueda por identificador y eliminación/restauración lógica.

- Los estados son `AVAILABLE`, `IN_MAINTENANCE` e `INACTIVE`.

- License plates are normalized to uppercase and cannot be duplicated among active vehicles.

### Workshops

- `POST /workshops`, `GET /workshops`, `GET /workshops/:id` y `PATCH /workshops/:id/status`.

- Los estados son `ACTIVE` e `INACTIVE`; el listado general devuelve solo talleres activos.

- New maintenance records can only be assigned to active workshops. Deactivating a workshop does not delete maintenance records or their history.

### Maintenance

- `POST /maintenances` programa; `GET /maintenances` lista todos y `GET /maintenances/active` lista `SCHEDULED` e `IN_PROGRESS`.

- There are also queries by ID, vehicle, mechanic, and the vehicle's complete history.

- Each maintenance record links an active vehicle, technician, and workshop. The scheduled mileage cannot be lower than the vehicle's odometer reading.

- Los tipos son `PREVENTIVE` y `CORRECTIVE`. Los estados son `SCHEDULED`, `IN_PROGRESS`, `COMPLETED` y `CANCELLED`.

- Debe incluir `scheduledAt` y `scheduledEndAt`. El fin debe ser posterior al inicio. Un técnico no puede tener dos mantenimientos activos con intervalos superpuestos; los turnos contiguos sí se permiten.

- `COMPLETED` y `CANCELLED` son estados terminales. Para completar, hay que registrar trabajo realizado, costo final, fecha real de finalización y kilometraje final.

- Deactivating a vehicle or technician does not delete their maintenance records or prevent access to existing history. It does prevent new assignments.

Los ejemplos de payloads y respuestas están en la documentación detallada de [usuarios](src/docs/users-crud.md), [vehículos](src/docs/vehicles-crud.md), [talleres](src/docs/workshops-crud.md), [mantenimientos](src/docs/maintenances-crud.md) y [autenticación de Swagger](src/docs/swagger-cookie-auth.md).

## Development and testing

To run only PostgreSQL and Redis in Docker while running the API on your machine:

```sh

docker compose up -d postgres redis

npm install

npm run migration:run

npm run start:dev

```

Comandos útiles:

| Command              | Description                           |

| -------------------- | -------------------------------------- |

| `npm run start:dev`  | Starts NestJS in watch mode.           |

| `npm run build`      | Compila a `dist/`.                     |

| `npm run start:prod` | Starts the production build.   |

| `npm run lint`       | Runs ESLint.                        |

| `npm test`           | Runs the unit tests.         |

| `npm run test:watch` | Runs the tests in watch mode.     |

| `npm run test:cov`   | Runs tests with coverage.         |

| `npm run test:e2e`   | Runs the end-to-end test suite. |

To view logs or stop the containers:

```sh

docker compose logs -f api

docker compose down

```

`docker compose down` conserva los datos de volúmenes. No uses `docker compose down -v` salvo que quieras eliminar permanentemente la base local.

## Project structure

```text

src/

├── config/                 # Database and Swagger configuration

├── infrastructure/

│   ├── database/           # TypeORM DataSource and migrations

│   ├── health/             # Health check

│   └── redis/              # Sessions and token revocation

├── modules/

│   ├── auth/               # Login, refresh, logout, and guards

│   ├── users/              # Users, roles, and technician profiles

│   ├── vehicles/           # Fleet and soft deletion/restoration

│   ├── workshops/          # Workshops and availability

│   └── maintenances/       # Scheduling, history, and work completion

├── shared/                 # Shared utilities

└── docs/                   # API guides and business rules

```

## Troubleshooting

- **Swagger muestra `401`:** inicia sesión desde `POST /auth/login`, comprueba que las cookies estén habilitadas y que Swagger y la API usen el mismo host, esquema y puerto.

- **The cookie is not sent over HTTP:** usa `COOKIE_SECURE=false` para desarrollo local; usa `true` solo sobre HTTPS.

- **Error `relation does not exist`:** ejecuta `npm run migration:run` y confirma que `.env` apunta a la misma base que usa la API.

- **Error when assigning maintenance:** verifica que vehículo, técnico y taller estén activos, que el usuario tenga rol `TECHNICIAN`, que el kilometraje sea válido y que el horario no se cruce con otro del mismo técnico.

- **Container diagnostics:** revisa `docker compose ps` y `docker compose logs -f api postgres redis`.