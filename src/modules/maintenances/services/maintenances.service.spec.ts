import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../users/entities/user-role.enum.js';
import { UserStatus } from '../../users/entities/user-status.enum.js';
import type { UsersService } from '../../users/services/users.service.js';
import { VehicleStatus } from '../../vehicles/entities/vehicle-status.enum.js';
import type { VehiclesService } from '../../vehicles/services/vehicles.service.js';
import type { WorkshopsService } from '../../workshops/services/workshops.service.js';
import type { MaintenanceDao } from '../dao/maintenance.dao.js';
import { CreateMaintenanceDto } from '../dtos/create-maintenance.dto.js';
import { UpdateMaintenanceStatusDto } from '../dtos/update-maintenance-status.dto.js';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';
import { MaintenanceType } from '../entities/maintenance-type.enum.js';
import { Maintenance } from '../entities/maintenance.entity.js';
import { MaintenancesService } from './maintenances.service.js';

describe('MaintenancesService', () => {
  const now = new Date('2026-11-01T10:00:00Z');
  const maintenance = Object.assign(new Maintenance(), {
    id: 8,
    type: MaintenanceType.PREVENTIVE,
    description: 'Oil change',
    mileage: 45200,
    scheduledAt: now,
    scheduledEndAt: new Date('2026-11-01T11:00:00Z'),
    status: MaintenanceStatus.SCHEDULED,
    workPerformed: null,
    finalCost: null,
    completedAt: null,
    finalMileage: null,
    vehicle: {
      id: 17,
      plate: 'ABC-123',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      mileage: 45000,
      status: VehicleStatus.AVAILABLE,
      createdAt: now,
      updatedAt: now,
    },
    mechanic: {
      id: 12,
      name: 'Taylor Mechanic',
      email: 'tech@example.com',
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      technicianProfile: { specialty: 'Mechanics' },
      createdAt: now,
      updatedAt: now,
    },
    workshop: {
      id: 4,
      name: 'Central Workshop',
      address: '1 Main Street',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  });

  const setup = () => {
    maintenance.status = MaintenanceStatus.SCHEDULED;
    maintenance.workPerformed = null;
    maintenance.finalCost = null;
    maintenance.completedAt = null;
    maintenance.finalMileage = null;
    const dao = {
      create: vi.fn((fields: Partial<Maintenance>) => Object.assign(new Maintenance(), fields)),
      save: vi.fn(async (value: Maintenance) => Object.assign(maintenance, value, { id: 8 })),
      findAll: vi.fn().mockResolvedValue([maintenance]),
      findActive: vi.fn().mockResolvedValue([maintenance]),
      findById: vi.fn().mockResolvedValue(maintenance),
      findByVehicle: vi.fn().mockResolvedValue([maintenance]),
      findByMechanic: vi.fn().mockResolvedValue([maintenance]),
      findVehicleHistory: vi.fn().mockResolvedValue([maintenance]),
      hasMechanicScheduleOverlap: vi.fn().mockResolvedValue(false),
    } as unknown as MaintenanceDao;
    const vehicles = {
      findOne: vi.fn().mockResolvedValue({ id: 17, mileage: 45000, status: VehicleStatus.AVAILABLE }),
    } as unknown as VehiclesService;
    const users = {
      findOne: vi.fn().mockResolvedValue({ id: 12, role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE }),
    } as unknown as UsersService;
    const workshops = {
      assertCanAssignMaintenance: vi.fn().mockResolvedValue(undefined),
    } as unknown as WorkshopsService;
    return { service: new MaintenancesService(dao, vehicles, users, workshops), dao, vehicles, users, workshops };
  };

  it('creates maintenance in SCHEDULED status and validates assigned resources', async () => {
    const { service, dao, vehicles, users, workshops } = setup();
    const result = await service.create({
      type: MaintenanceType.PREVENTIVE,
      description: 'Oil change',
      mileage: 45200,
      scheduledAt: now,
      scheduledEndAt: new Date('2026-11-01T11:00:00Z'),
      vehicleId: 17,
      mechanicId: 12,
      workshopId: 4,
    } as CreateMaintenanceDto);
    expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
    expect(vehicles.findOne).toHaveBeenCalledWith(17);
    expect(users.findOne).toHaveBeenCalledWith(12);
    expect(workshops.assertCanAssignMaintenance).toHaveBeenCalledWith(4);
    expect(dao.hasMechanicScheduleOverlap).toHaveBeenCalledWith(12, now, new Date('2026-11-01T11:00:00Z'));
    expect(dao.save).toHaveBeenCalled();
  });

  it('rejects inactive vehicle, non-technician, and mileage below vehicle odometer', async () => {
    const { service, dao, vehicles, users } = setup();
    const payload = {
      type: MaintenanceType.CORRECTIVE,
      description: 'Repair',
      mileage: 45200,
      scheduledAt: now,
      scheduledEndAt: new Date('2026-11-01T11:00:00Z'),
      vehicleId: 17,
      mechanicId: 12,
      workshopId: 4,
    } as CreateMaintenanceDto;
    vi.mocked(vehicles.findOne).mockResolvedValue({ id: 17, mileage: 45000, status: VehicleStatus.INACTIVE } as never);
    await expect(service.create(payload)).rejects.toThrow(ConflictException);
    expect(dao.save).not.toHaveBeenCalled();
    vi.mocked(vehicles.findOne).mockResolvedValue({ id: 17, mileage: 45000, status: VehicleStatus.AVAILABLE } as never);
    vi.mocked(users.findOne).mockResolvedValue({ id: 12, role: UserRole.ADMIN, status: UserStatus.ACTIVE } as never);
    await expect(service.create(payload)).rejects.toThrow(ConflictException);
    vi.mocked(users.findOne).mockResolvedValue({
      id: 12,
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
    } as never);
    await expect(service.create({ ...payload, mileage: 44999 })).rejects.toThrow(BadRequestException);
  });

  it('rejects assignments to missing or inactive workshops', async () => {
    const { service, workshops } = setup();
    const payload = {
      type: MaintenanceType.PREVENTIVE,
      description: 'Oil change',
      mileage: 45200,
      scheduledAt: now,
      scheduledEndAt: new Date('2026-11-01T11:00:00Z'),
      vehicleId: 17,
      mechanicId: 12,
      workshopId: 404,
    } as CreateMaintenanceDto;
    vi.mocked(workshops.assertCanAssignMaintenance).mockRejectedValue(new NotFoundException('Workshop not found.'));
    await expect(service.create(payload)).rejects.toThrow(NotFoundException);
    vi.mocked(workshops.assertCanAssignMaintenance).mockRejectedValue(new ConflictException('Workshop is inactive.'));
    await expect(service.create(payload)).rejects.toThrow(ConflictException);
  });

  it('rejects overlapping active assignments for the same mechanic', async () => {
    const { service, dao } = setup();
    vi.mocked(dao.hasMechanicScheduleOverlap).mockResolvedValue(true);
    await expect(
      service.create({
        type: MaintenanceType.PREVENTIVE,
        description: 'Oil change',
        mileage: 45200,
        scheduledAt: now,
        scheduledEndAt: new Date('2026-11-01T11:00:00Z'),
        vehicleId: 17,
        mechanicId: 12,
        workshopId: 4,
      } as CreateMaintenanceDto),
    ).rejects.toThrow(ConflictException);
  });

  it('lists all, active, vehicle, mechanic, and vehicle-history records', async () => {
    const { service } = setup();
    expect(await service.findAll()).toHaveLength(1);
    expect(await service.findActive()).toHaveLength(1);
    expect(await service.findByVehicle(17)).toHaveLength(1);
    expect(await service.findByMechanic(12)).toHaveLength(1);
    expect(await service.findVehicleHistory(17)).toHaveLength(1);
  });

  it('keeps maintenance history when its vehicle, mechanic, or both become inactive', async () => {
    const { service, vehicles, users, dao } = setup();
    const assertHistoryStillAvailable = async () => {
      expect(await service.findVehicleHistory(17)).toHaveLength(1);
      expect(await service.findByMechanic(12)).toHaveLength(1);
      expect(await service.findOne(8)).toMatchObject({ id: 8 });
    };

    await assertHistoryStillAvailable();
    vi.mocked(vehicles.findOne).mockResolvedValue({
      id: 17,
      mileage: 45000,
      status: VehicleStatus.INACTIVE,
    } as never);
    await assertHistoryStillAvailable();

    vi.mocked(users.findOne).mockResolvedValue({
      id: 12,
      role: UserRole.TECHNICIAN,
      status: UserStatus.INACTIVE,
    } as never);
    await assertHistoryStillAvailable();
    expect(dao.findVehicleHistory).toHaveBeenCalledTimes(3);
    expect(dao.findByMechanic).toHaveBeenCalledTimes(3);
  });

  it('requires closeout data, validates final mileage, and completes once', async () => {
    const { service, dao } = setup();
    await expect(
      service.updateStatus(8, { status: MaintenanceStatus.COMPLETED } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateStatus(8, {
        status: MaintenanceStatus.COMPLETED,
        workPerformed: 'Oil change',
        finalCost: 50,
        completedAt: now,
        finalMileage: 45199,
      } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(BadRequestException);
    const result = await service.updateStatus(8, {
      status: MaintenanceStatus.COMPLETED,
      workPerformed: 'Oil change',
      finalCost: 50,
      completedAt: now,
      finalMileage: 45300,
    } as UpdateMaintenanceStatusDto);
    expect(result.status).toBe(MaintenanceStatus.COMPLETED);
    await expect(
      service.updateStatus(8, { status: MaintenanceStatus.CANCELLED } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(ConflictException);
    expect(dao.save).toHaveBeenCalled();
  });

  it('makes cancelled maintenance terminal and rejects later status changes', async () => {
    const { service, dao } = setup();
    const cancelled = await service.updateStatus(8, {
      status: MaintenanceStatus.CANCELLED,
    } as UpdateMaintenanceStatusDto);
    expect(cancelled.status).toBe(MaintenanceStatus.CANCELLED);

    await expect(
      service.updateStatus(8, { status: MaintenanceStatus.IN_PROGRESS } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.updateStatus(8, { status: MaintenanceStatus.SCHEDULED } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.updateStatus(8, { status: MaintenanceStatus.CANCELLED } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(ConflictException);
    expect(dao.save).toHaveBeenCalledTimes(1);
  });

  it('returns not found for missing maintenance records', async () => {
    const { service, dao } = setup();
    vi.mocked(dao.findById).mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
    await expect(
      service.updateStatus(404, { status: MaintenanceStatus.IN_PROGRESS } as UpdateMaintenanceStatusDto),
    ).rejects.toThrow(NotFoundException);
  });
});
