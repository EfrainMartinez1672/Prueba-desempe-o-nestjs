# Vehicle Fleet CRUD

All vehicle endpoints use the configured API prefix (default `/api/v2`) and require an administrator session. Sign in through `POST /auth/login` first; Swagger sends the HttpOnly access cookie automatically.

## Vehicle fields

- `plate`: required, 2–15 characters, normalized to uppercase. Active plates are unique.
- `make`: required, 1–80 characters.
- `model`: required, 1–100 characters.
- `year`: required integer from 1886 through next calendar year.
- `mileage`: required non-negative integer, in kilometers.
- `status`: `AVAILABLE`, `IN_MAINTENANCE`, or `INACTIVE`; defaults to `AVAILABLE`.

Deleted rows do not block plate reuse. Restoring a vehicle returns `409 Conflict` if another active vehicle has claimed its plate.

## Endpoints

| Method   | Path                    | Behavior                        |
| -------- | ----------------------- | ------------------------------- |
| `POST`   | `/vehicles`             | Create a vehicle.               |
| `GET`    | `/vehicles`             | List active vehicles.           |
| `GET`    | `/vehicles/:id`         | Find one active vehicle by ID.  |
| `PATCH`  | `/vehicles/:id`         | Update one or more fields.      |
| `DELETE` | `/vehicles/:id`         | Soft-delete a vehicle.          |
| `POST`   | `/vehicles/:id/restore` | Restore a soft-deleted vehicle. |

All endpoints are admin-only. `GET` and `PATCH` do not expose soft-deleted records. A second delete, restoring a non-deleted ID, or looking up a deleted record returns `404`.

## Create example

```json
{
  "plate": "ABC-123",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2022,
  "mileage": 45200,
  "status": "AVAILABLE"
}
```

## Database migration

Schema synchronization is disabled. Apply the migration after the database is running:

```sh
npm run migration:run
```

The migration creates the `vehicles` table, status enum, and a partial unique index for active vehicle plates.
