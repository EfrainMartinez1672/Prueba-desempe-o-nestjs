import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { WorkshopDao } from '../dao/workshop.dao.js';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';
import { Workshop } from '../entities/workshop.entity.js';
import { WorkshopsService } from './workshops.service.js';

describe('WorkshopsService', () => {
  const buildWorkshop = (fields: Partial<Workshop> = {}) =>
    Object.assign(new Workshop(), {
      id: 3,
      name: 'Central Workshop',
      address: '123 Main Street',
      status: WorkshopStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...fields,
    });

  const setup = () => {
    const workshop = buildWorkshop();
    const dao = {
      create: vi.fn((fields: Partial<Workshop>) => Object.assign(new Workshop(), fields)),
      save: vi.fn(async (value: Workshop) =>
        Object.assign(workshop, value, { id: 3, createdAt: workshop.createdAt, updatedAt: workshop.updatedAt }),
      ),
      findActive: vi.fn().mockResolvedValue([workshop]),
      findById: vi.fn().mockResolvedValue(workshop),
      existsActiveName: vi.fn().mockResolvedValue(false),
    } as unknown as WorkshopDao;
    return { service: new WorkshopsService(dao), dao, workshop };
  };

  it('creates a workshop and lists only active records from its DAO', async () => {
    const { service, dao } = setup();
    const created = await service.create({ name: ' Central Workshop ', address: '123 Main Street' });
    expect(created.name).toBe('Central Workshop');
    expect((await service.findActive()).map((workshop) => workshop.id)).toEqual([3]);
    expect(dao.findActive).toHaveBeenCalled();
  });

  it('activates and deactivates workshops and rejects duplicate active names', async () => {
    const { service, dao } = setup();
    const inactive = await service.updateStatus(3, { status: WorkshopStatus.INACTIVE });
    expect(inactive.status).toBe(WorkshopStatus.INACTIVE);
    vi.mocked(dao.existsActiveName).mockResolvedValue(true);
    await expect(service.updateStatus(3, { status: WorkshopStatus.ACTIVE })).rejects.toThrow(ConflictException);
  });

  it('allows maintenance assignment only to an existing active workshop', async () => {
    const { service, dao, workshop } = setup();
    await expect(service.assertCanAssignMaintenance(3)).resolves.toBeUndefined();
    workshop.status = WorkshopStatus.INACTIVE;
    await expect(service.assertCanAssignMaintenance(3)).rejects.toThrow(ConflictException);
    vi.mocked(dao.findById).mockResolvedValue(null);
    await expect(service.assertCanAssignMaintenance(404)).rejects.toThrow(ConflictException);
  });

  it('returns not found for an unknown workshop', async () => {
    const { service, dao } = setup();
    vi.mocked(dao.findById).mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
  });
});
