import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';

export const CreateWorkshopSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(300),
  status: z.nativeEnum(WorkshopStatus).default(WorkshopStatus.ACTIVE),
});

export class CreateWorkshopDto extends createZodDto(CreateWorkshopSchema) {}
