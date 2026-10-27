# User Accounts and CRUD

## Data model

The `users` table stores account-wide fields: name, unique email, password hash, role, status, and timestamps. Roles are `ADMIN` and `TECHNICIAN`; statuses are `ACTIVE` and `INACTIVE`. The account is never soft-deleted.

Technician-only data is stored in the one-to-one `technician_profiles` table. Admin accounts do not have a technician profile. There is one account-creation endpoint: `POST /users`, protected for administrators. Public registration has intentionally been removed; only an administrator can create accounts and assign roles.

Passwords are hashed with bcrypt and excluded from normal entity queries. API responses use `UserResponseDto` and never include the password hash.

## Migration

Schema synchronization is disabled. Apply the initial migration after configuring the database:

```sh
npm run migration:run
```

The migrations create the users table, role/status enums, and technician profiles table. The status migration maps previously soft-deleted accounts to `INACTIVE` before dropping `deleted_at`. To roll back the latest migration, run `npm run migration:revert`.

## Endpoints

All routes use the global API prefix, which defaults to `/api/v2`.

| Method  | Path                | Description                                                                                          |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `POST`  | `/users`            | Create an account. Requires an administrator session cookie.                                         |
| `GET`   | `/users`            | List active and inactive accounts. Requires an administrator session cookie.                         |
| `GET`   | `/users/:id`        | Get one account. Requires an administrator session cookie.                                           |
| `PATCH` | `/users/:id`        | Update account fields or technician specialty. Requires an administrator session cookie.             |
| `PATCH` | `/users/:id/status` | Activate or deactivate an account (`ACTIVE` / `INACTIVE`). Requires an administrator session cookie. |

Every CRUD endpoint is protected by `JwtAuthGuard` and `RolesGuard`. The role guard checks the current role in the database, so role changes take effect without waiting for an access token to expire.

### Create account body

```json
{
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "password": "a-strong-password",
  "role": "TECHNICIAN",
  "status": "ACTIVE",
  "specialty": "Electrical systems"
}
```

`role` must be `ADMIN` or `TECHNICIAN`. Technicians must have a specialty; admins cannot have one. On update, setting `specialty` to `null` removes the profile, but a technician cannot be left without a specialty. Account availability is managed exclusively through its `status`.

Inactive users cannot log in, refresh a session, or continue using an existing access cookie. They remain queryable by administrators and can be reactivated through `PATCH /users/:id/status`.

## First administrator

The only account-creation endpoint is admin-only, so provision the first administrator through a trusted database session after applying the migration. Generate a bcrypt hash using a trusted local bootstrap process, then insert the account directly. Do not store a real password or hash in source control:

```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ('Initial Administrator', 'admin@example.com', '<bcrypt-hash>', 'ADMIN');
```

After provisioning, sign in through `POST /auth/login`. The API sets HttpOnly access and refresh cookies; Swagger sends them automatically for the user CRUD endpoints. Never expose an endpoint that lets an unauthenticated caller create accounts or promote roles.
