import { hash } from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import type { UserDao } from '../dao/user.dao.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UserRole } from '../entities/user-role.enum.js';
import { UserStatus } from '../entities/user-status.enum.js';
import { User } from '../entities/user.entity.js';
import { UsersService } from './users.service.js';

vi.mock('bcrypt', () => ({ hash: vi.fn(async (value: string) => `hashed:${value}`) }));

describe('UsersService', () => {
  it('creates a technician with a hashed password and a separate specialty profile', async () => {
    const userDao = {
      create: vi.fn((fields: Partial<User>) => Object.assign(new User(), fields)),
      save: vi.fn(async (user: User) =>
        Object.assign(user, {
          id: 12,
          status: UserStatus.ACTIVE,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ),
    } as unknown as UserDao;
    const service = new UsersService(userDao);

    const result = await service.create({
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      password: 'secure-password',
      role: UserRole.TECHNICIAN,
      specialty: 'Electrical systems',
    } as CreateUserDto);

    expect(hash).toHaveBeenCalledWith('secure-password', 12);
    expect(userDao.save).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'hashed:secure-password',
        role: UserRole.TECHNICIAN,
        technicianProfile: expect.objectContaining({
          specialty: 'Electrical systems',
          user: expect.any(User),
        }),
      }),
    );
    expect(result).toMatchObject({
      id: 12,
      role: UserRole.TECHNICIAN,
      specialty: 'Electrical systems',
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.status).toBe(UserStatus.ACTIVE);
  });

  it('activates and deactivates an account using its status field', async () => {
    const user = Object.assign(new User(), {
      id: 21,
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      passwordHash: 'stored-hash',
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      technicianProfile: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const userDao = {
      findById: vi.fn().mockResolvedValue(user),
      save: vi.fn(async (value: User) => value),
    } as unknown as UserDao;
    const service = new UsersService(userDao);

    await expect(service.updateStatus(21, UserStatus.INACTIVE)).resolves.toMatchObject({
      id: 21,
      status: UserStatus.INACTIVE,
    });
    await expect(service.updateStatus(21, UserStatus.ACTIVE)).resolves.toMatchObject({
      id: 21,
      status: UserStatus.ACTIVE,
    });
    expect(userDao.save).toHaveBeenCalledTimes(2);
  });
});
