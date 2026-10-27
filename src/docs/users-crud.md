# User Accounts and CRUD

## Data model

The `users` table stores account-wide fields: name, unique email, password hash, role, timestamps, and a soft-delete timestamp. Roles are `ADMIN` and `TECHNICIAN`.

Technician-only data is stored in the one-to-one `technician_profiles` table. Admin accounts do not have a technician profile. The public registration endpoint always assigns the `TECHNICIAN` role; it never accepts a role from the request. Registration requires a specialty.

Passwords are hashed with bcrypt and excluded from normal entity queries. API responses use `UserResponseDto` and never include the password hash.

## Migration

Schema synchronization is disabled. Apply the initial migration after configuring the database:

```sh
npm run migration:run
```

The migration creates the users table, role enum, and technician profiles table. To roll it back, run `npm run migration:revert`.

## Endpoints

All routes use the global API prefix, which defaults to `/api/v2`.

| Method   | Path         | Description                                                                    |
| -------- | ------------ | ------------------------------------------------------------------------------ |
| `POST`   | `/users`     | Create an account. Requires an admin access token.                             |
| `GET`    | `/users`     | List accounts. Requires an admin access token.                                 |
| `GET`    | `/users/:id` | Get one account. Requires an admin access token.                               |
| `PATCH`  | `/users/:id` | Update account fields or technician specialty. Requires an admin access token. |
| `DELETE` | `/users/:id` | Soft-delete an account. Requires an admin access token.                        |

Every CRUD endpoint is protected by `JwtAuthGuard` and `RolesGuard`. The role guard checks the current role in the database, so role changes take effect without waiting for an access token to expire.

### Create account body

```json
{
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "password": "a-strong-password",
  "role": "TECHNICIAN",
  "specialty": "Electrical systems"
}
```

`role` must be `ADMIN` or `TECHNICIAN`. Technicians must have a specialty; admins cannot have one. On update, setting `specialty` to `null` removes the profile, but a technician cannot be left without a specialty.

## First administrator

The CRUD API is admin-only and intentionally does not allow public role selection. Register the first account through the existing auth registration endpoint, apply the migration, then promote that account using a trusted database session:

```sql
BEGIN;
DELETE FROM technician_profiles
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com' AND deleted_at IS NULL);
UPDATE users
SET role = 'ADMIN', updated_at = now()
WHERE email = 'admin@example.com' AND deleted_at IS NULL;
COMMIT;
```

After promotion, sign in again to obtain an access token and use it for the user CRUD endpoints. Never expose an endpoint that lets an unauthenticated caller promote accounts.
