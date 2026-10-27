import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';

export const UpdateWorkshopStatusSchema = z.object({ status: z.nativeEnum(WorkshopStatus) }).strict();

export class UpdateWorkshopStatusDto extends createZodDto(UpdateWorkshopStatusSchema) {}
