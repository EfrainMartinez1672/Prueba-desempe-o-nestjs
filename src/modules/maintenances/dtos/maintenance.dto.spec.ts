import { describe, expect, it } from 'vitest';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';
import { MaintenanceType } from '../entities/maintenance-type.enum.js';
import { CreateMaintenanceSchema } from './create-maintenance.dto.js';
import { UpdateMaintenanceStatusSchema } from './update-maintenance-status.dto.js';

describe('Maintenance DTO schemas', () => {
  it('accepts required schedule data and rejects missing or invalid values', () => {
    const parsed = CreateMaintenanceSchema.parse({
      type: MaintenanceType.PREVENTIVE,
      description: 'Oil change',
      mileage: '45200',
      scheduledAt: '2026-11-01T10:00:00Z',
      scheduledEndAt: '2026-11-01T11:00:00Z',
      vehicleId: '17',
      mechanicId: '12',
      workshopId: '4',
    });
    expect(parsed.mileage).toBe(45200);
    expect(parsed.scheduledAt).toBeInstanceOf(Date);
    expect(parsed.scheduledEndAt).toBeInstanceOf(Date);
    expect(CreateMaintenanceSchema.safeParse({ type: 'OTHER' }).success).toBe(false);
    expect(
      CreateMaintenanceSchema.safeParse({
        type: MaintenanceType.PREVENTIVE,
        description: 'Oil change',
        mileage: 45200,
        scheduledAt: '2026-11-01T10:00:00Z',
        scheduledEndAt: '2026-11-01T10:00:00Z',
        vehicleId: 17,
        mechanicId: 12,
        workshopId: 4,
      }).success,
    ).toBe(false);
  });

  it('requires all closeout fields for completion and only permits them for completion', () => {
    expect(UpdateMaintenanceStatusSchema.safeParse({ status: MaintenanceStatus.COMPLETED }).success).toBe(false);
    expect(
      UpdateMaintenanceStatusSchema.safeParse({
        status: MaintenanceStatus.COMPLETED,
        workPerformed: 'Oil change',
        finalCost: 125.5,
        completedAt: '2026-11-01T11:00:00Z',
        finalMileage: 45300,
      }).success,
    ).toBe(true);
    expect(
      UpdateMaintenanceStatusSchema.safeParse({ status: MaintenanceStatus.IN_PROGRESS, finalCost: 100 }).success,
    ).toBe(false);
  });
});
