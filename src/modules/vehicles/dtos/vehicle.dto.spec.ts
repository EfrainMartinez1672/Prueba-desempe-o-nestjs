import { describe, expect, it } from 'vitest';
import { VehicleStatus } from '../entities/vehicle-status.enum.js';
import { CreateVehicleSchema } from './create-vehicle.dto.js';
import { UpdateVehicleSchema } from './update-vehicle.dto.js';

describe('Vehicle DTO schemas', () => {
  it('normalizes plates and defaults status to available', () => {
    expect(
      CreateVehicleSchema.parse({ plate: ' abc-123 ', make: ' Toyota ', model: ' Corolla ', year: 2022, mileage: 0 }),
    ).toMatchObject({ plate: 'ABC-123', make: 'Toyota', model: 'Corolla', status: VehicleStatus.AVAILABLE });
  });

  it('rejects invalid mileage, year, status and empty updates', () => {
    expect(
      CreateVehicleSchema.safeParse({ plate: 'A', make: 'Toyota', model: 'Corolla', year: 2022, mileage: -1 }).success,
    ).toBe(false);
    expect(
      CreateVehicleSchema.safeParse({ plate: 'ABC', make: 'Toyota', model: 'Corolla', year: 1800, mileage: 0 }).success,
    ).toBe(false);
    expect(
      CreateVehicleSchema.safeParse({
        plate: 'ABC',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        mileage: 0,
        status: 'BROKEN',
      }).success,
    ).toBe(false);
    expect(UpdateVehicleSchema.safeParse({}).success).toBe(false);
  });
});
