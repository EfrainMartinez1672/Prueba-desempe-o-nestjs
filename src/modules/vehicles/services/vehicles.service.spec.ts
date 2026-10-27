import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { VehicleDao } from '../dao/vehicle.dao.js';
import { VehicleStatus } from '../entities/vehicle-status.enum.js';
import { Vehicle } from '../entities/vehicle.entity.js';
import { VehiclesService } from './vehicles.service.js';

describe('VehiclesService', () => {
  const buildVehicle = (fields: Partial<Vehicle> = {}) =>
    Object.assign(new Vehicle(), {
      id: 8,
      plate: 'ABC-123',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      mileage: 10000,
      status: VehicleStatus.AVAILABLE,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      deletedAt: null,
      ...fields,
    });

  const setup = () => {
    const vehicle = buildVehicle();
    const dao = {
      create: vi.fn((fields: Partial<Vehicle>) => Object.assign(new Vehicle(), fields)),
      save: vi.fn(async (value: Vehicle) => Object.assign(vehicle, value)),
      findAll: vi.fn().mockResolvedValue([vehicle]),
      findById: vi.fn().mockResolvedValue(vehicle),
      findDeletedById: vi.fn().mockResolvedValue(buildVehicle({ deletedAt: new Date() })),
      existsActivePlate: vi.fn().mockResolvedValue(false),
      softDelete: vi.fn().mockResolvedValue(true),
      restore: vi.fn().mockResolvedValue(true),
    } as unknown as VehicleDao;
    return { service: new VehiclesService(dao), dao, vehicle };
  };

  it('creates a vehicle with a normalized plate', async () => {
    const { service, dao } = setup();
    const result = await service.create({
      plate: ' abc-123 ',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      mileage: 0,
      status: VehicleStatus.AVAILABLE,
    });
    expect(dao.existsActivePlate).toHaveBeenCalledWith('ABC-123');
    expect(result.plate).toBe('ABC-123');
  });

  it('rejects duplicate plates and supports update and soft-delete', async () => {
    const { service, dao } = setup();
    vi.mocked(dao.existsActivePlate).mockResolvedValue(true);
    await expect(
      service.create({
        plate: 'abc-123',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        mileage: 1,
        status: VehicleStatus.AVAILABLE,
      }),
    ).rejects.toThrow(ConflictException);
    vi.mocked(dao.existsActivePlate).mockResolvedValue(false);
    const updated = await service.update(8, { mileage: 12000 });
    expect(updated.mileage).toBe(12000);
    await expect(service.remove(8)).resolves.toEqual({ status: 'deleted' });
  });

  it('restores a soft-deleted vehicle and rejects plate collisions', async () => {
    const { service, dao } = setup();
    const deletedVehicle = buildVehicle({ deletedAt: new Date() });
    vi.mocked(dao.findDeletedById).mockResolvedValue(deletedVehicle);
    await expect(service.restore(8)).resolves.toMatchObject({ id: 8, plate: 'ABC-123' });
    expect(dao.restore).toHaveBeenCalledWith(8);
    vi.mocked(dao.existsActivePlate).mockResolvedValue(true);
    await expect(service.restore(8)).rejects.toThrow(ConflictException);
  });

  it('returns not found for missing and already-deleted vehicles', async () => {
    const { service, dao } = setup();
    vi.mocked(dao.findById).mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
    vi.mocked(dao.findDeletedById).mockResolvedValue(null);
    await expect(service.restore(404)).rejects.toThrow(NotFoundException);
  });
});
