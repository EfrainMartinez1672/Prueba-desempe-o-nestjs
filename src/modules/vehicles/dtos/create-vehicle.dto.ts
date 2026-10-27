import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VehicleStatus } from '../entities/vehicle-status.enum.js';

const currentYear = new Date().getFullYear();

export const CreateVehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(2)
    .max(15)
    .transform((plate) => plate.toUpperCase()),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  year: z
    .number()
    .int()
    .min(1886)
    .max(currentYear + 1),
  mileage: z.coerce.number().int().min(0).max(2_147_483_647),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
});

export class CreateVehicleDto extends createZodDto(CreateVehicleSchema) {}
