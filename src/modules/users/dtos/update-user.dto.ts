import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserRole } from '../entities/user-role.enum.js';

export const UpdateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((email) => email.toLowerCase())
      .optional(),
    password: z.string().min(8).max(72).optional(),
    role: z.nativeEnum(UserRole).optional(),
    specialty: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .strict()
  .superRefine((user, context) => {
    if (user.role === UserRole.ADMIN && typeof user.specialty === 'string') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialty'],
        message: 'Admins cannot have a specialty.',
      });
    }
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.');

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
