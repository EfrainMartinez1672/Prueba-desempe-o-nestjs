# Maintenance scheduling and history

All maintenance endpoints require an administrator session cookie. Sign in at `POST /auth/login`; Swagger sends the HttpOnly access cookie automatically.

## Data model and assignment rules

Each maintenance record references one vehicle, one mechanic (`TECHNICIAN` user), and one active workshop. Vehicle and mechanic must also be active. A deleted/nonexistent vehicle, nonexistent user, inactive mechanic, or missing/inactive workshop is rejected. Scheduled mileage cannot be lower than the vehicle's current mileage.

Every appointment requires both `scheduledAt` and `scheduledEndAt`; the end must be later than the start. Active appointments (`SCHEDULED` or `IN_PROGRESS`) for one mechanic cannot overlap. Adjacent time slots are allowed (one may start exactly when the previous one ends). Cancelled and completed records no longer reserve a mechanic's schedule. `completedAt` is the actual completion timestamp and is separate from the required planned end time.

Types are `PREVENTIVE` and `CORRECTIVE`. New records always start in `SCHEDULED`.

Statuses are `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, and `CANCELLED`. `COMPLETED` and `CANCELLED` are terminal: once a maintenance reaches either status, its status cannot be changed again. Completion requires all four closeout values: `workPerformed`, `finalCost` (non-negative), `completedAt`, and `finalMileage` (not less than scheduled mileage). These fields are null until completion.

## Endpoints

| Method  | Path                                       | Behavior                                                         |
| ------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `POST`  | `/maintenances`                            | Schedule maintenance and assign vehicle, mechanic, and workshop. |
| `GET`   | `/maintenances`                            | List all maintenance records.                                    |
| `GET`   | `/maintenances/active`                     | List `SCHEDULED` and `IN_PROGRESS` records.                      |
| `GET`   | `/maintenances/:id`                        | Get a maintenance record by ID.                                  |
| `GET`   | `/maintenances/vehicle/:vehicleId`         | List maintenance records for one vehicle.                        |
| `GET`   | `/maintenances/vehicle/:vehicleId/history` | Get the complete vehicle maintenance history.                    |
| `GET`   | `/maintenances/mechanic/:mechanicId`       | List records assigned to one mechanic.                           |
| `PATCH` | `/maintenances/:id/status`                 | Update status; provide closeout fields when completing.          |

## Schedule example

```json
{
  "type": "PREVENTIVE",
  "description": "Oil and filter change",
  "mileage": 45200,
  "scheduledAt": "2026-11-01T10:00:00Z",
  "scheduledEndAt": "2026-11-01T11:00:00Z",
  "vehicleId": 17,
  "mechanicId": 12,
  "workshopId": 4
}
```

## Complete example

```json
{
  "status": "COMPLETED",
  "workPerformed": "Replaced engine oil and filter.",
  "finalCost": 275.5,
  "completedAt": "2026-11-01T11:15:00Z",
  "finalMileage": 45300
}
```

## Migration

Run `npm run migration:run` to create the maintenance types/table, foreign keys, checks, and lookup indexes. The scheduling migration backfills existing records with a one-hour planned window and adds a PostgreSQL exclusion constraint as a concurrency-safe backstop. Any existing overlapping `SCHEDULED`/`IN_PROGRESS` records must be corrected before applying that migration.
