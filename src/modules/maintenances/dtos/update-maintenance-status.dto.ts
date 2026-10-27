import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';

export const UpdateMaintenanceStatusSchema = z
  .object({
    status: z.nativeEnum(MaintenanceStatus),
    workPerformed: z.string().trim().min(1).max(10000).optional(),
    finalCost: z.coerce.number().finite().min(0).max(9999999999.99).optional(),
    completedAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
    finalMileage: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status !== MaintenanceStatus.COMPLETED) {
      for (const field of ['workPerformed', 'finalCost', 'completedAt', 'finalMileage'] as const) {
        if (value[field] !== undefined) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: 'Completion fields are only accepted when status is COMPLETED.',
          });
        }
      }
      return;
    }

    for (const field of ['workPerformed', 'finalCost', 'completedAt', 'finalMileage'] as const) {
      if (value[field] === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `The ${field} field is required to complete maintenance.`,
        });
      }
    }
  });

export class UpdateMaintenanceStatusDto extends createZodDto(UpdateMaintenanceStatusSchema) {}
