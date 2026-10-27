import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MaintenanceType } from '../entities/maintenance-type.enum.js';

export const CreateMaintenanceSchema = z
  .object({
    type: z.nativeEnum(MaintenanceType),
    description: z.string().trim().min(1).max(5000),
    mileage: z.coerce.number().int().min(0).max(2_147_483_647),
    scheduledAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
    scheduledEndAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
    vehicleId: z.coerce.number().int().positive(),
    mechanicId: z.coerce.number().int().positive(),
    workshopId: z.coerce.number().int().positive(),
  })
  .refine((value) => value.scheduledEndAt > value.scheduledAt, {
    path: ['scheduledEndAt'],
    message: 'Scheduled end must be later than scheduled start.',
  });

export class CreateMaintenanceDto extends createZodDto(CreateMaintenanceSchema) {}
