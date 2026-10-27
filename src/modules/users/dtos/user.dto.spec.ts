import { describe, expect, it } from 'vitest';
import { UserRole } from '../entities/user-role.enum.js';
import { UserStatus } from '../entities/user-status.enum.js';
import { CreateUserSchema } from './create-user.dto.js';
import { UpdateUserSchema } from './update-user.dto.js';

describe('User DTO schemas', () => {
  it('requires a specialty for technicians and rejects one for admins', () => {
    expect(
      CreateUserSchema.safeParse({
        name: 'Taylor Reed',
        email: 'taylor@example.com',
        password: 'secure-password',
        role: UserRole.TECHNICIAN,
      }).success,
    ).toBe(false);

    expect(
      CreateUserSchema.safeParse({
        name: 'Taylor Reed',
        email: 'taylor@example.com',
        password: 'secure-password',
        role: UserRole.ADMIN,
        specialty: 'Electrical systems',
      }).success,
    ).toBe(false);
  });

  it('normalizes email and accepts a valid technician profile', () => {
    expect(
      CreateUserSchema.parse({
        name: ' Taylor Reed ',
        email: ' TAYLOR@example.com ',
        password: 'secure-password',
        role: UserRole.TECHNICIAN,
        specialty: ' Electrical systems ',
      }),
    ).toMatchObject({
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      specialty: 'Electrical systems',
    });
  });

  it('rejects empty updates and unknown properties', () => {
    expect(UpdateUserSchema.safeParse({}).success).toBe(false);
    expect(UpdateUserSchema.safeParse({ isAdmin: true }).success).toBe(false);
  });
});
