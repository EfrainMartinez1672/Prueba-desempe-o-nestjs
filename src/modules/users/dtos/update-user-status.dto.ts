import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserStatus } from '../entities/user-status.enum.js';

export const UpdateUserStatusSchema = z.object({ status: z.nativeEnum(UserStatus) }).strict();

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}
