# Workshops

Workshop management is available under the configured API prefix (default `/api/v2`). Every endpoint requires an administrator session; sign in using `POST /auth/login` and Swagger sends the HttpOnly cookies automatically.

## Fields

- `name`: required, trimmed string of 1–120 characters.
- `address`: required, trimmed string of 1–300 characters.
- `status`: `ACTIVE` or `INACTIVE`; defaults to `ACTIVE`.

Workshop availability is controlled only by `status`; the table has no `deleted_at` column. Active workshop names are unique, case-insensitively. Inactive workshops do not appear in the active list and can be activated again unless an active workshop has the same name.

## Endpoints

| Method  | Path                    | Description                                 |
| ------- | ----------------------- | ------------------------------------------- |
| `POST`  | `/workshops`            | Register a workshop.                        |
| `GET`   | `/workshops`            | List active workshops only.                 |
| `GET`   | `/workshops/:id`        | Get a workshop by ID, including its status. |
| `PATCH` | `/workshops/:id/status` | Activate or deactivate a workshop.          |

## Maintenance assignment rule

The workshop service exposes `assertCanAssignMaintenance(workshopId)`. A maintenance creation/assignment flow must call it before saving the workshop ID. It rejects a missing or inactive workshop with `409 Conflict`. No maintenance assignment endpoint exists in the current API yet, so the guard is ready to be used when that module is added.

## Migration

After the database is running, apply the schema using:

```sh
npm run migration:run
```

The status migration maps previously soft-deleted workshops to `INACTIVE` before dropping `deleted_at`. The workshops table then uses only its `ACTIVE`/`INACTIVE` status, with a partial unique index for active workshop names.
