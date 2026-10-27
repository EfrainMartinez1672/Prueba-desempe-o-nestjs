import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserRole } from '../entities/user-role.enum.js';
import { UserStatus } from '../entities/user-status.enum.js';

export const CreateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(72),
    role: z.nativeEnum(UserRole),
    status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
    specialty: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((user, context) => {
    if (user.role === UserRole.ADMIN && user.specialty !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialty'],
        message: 'Admins cannot have a specialty.',
      });
    }
    if (user.role === UserRole.TECHNICIAN && user.specialty === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialty'],
        message: 'Technicians must have a specialty.',
      });
    }
  });

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
