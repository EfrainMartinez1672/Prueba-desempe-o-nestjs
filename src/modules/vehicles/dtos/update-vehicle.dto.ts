import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VehicleStatus } from '../entities/vehicle-status.enum.js';

const currentYear = new Date().getFullYear();

export const UpdateVehicleSchema = z
  .object({
    plate: z
      .string()
      .trim()
      .min(2)
      .max(15)
      .transform((plate) => plate.toUpperCase())
      .optional(),
    make: z.string().trim().min(1).max(80).optional(),
    model: z.string().trim().min(1).max(100).optional(),
    year: z
      .number()
      .int()
      .min(1886)
      .max(currentYear + 1)
      .optional(),
    mileage: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
    status: z.nativeEnum(VehicleStatus).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.');

export class UpdateVehicleDto extends createZodDto(UpdateVehicleSchema) {}
