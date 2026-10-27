import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../entities/vehicle-status.enum.js';
import { Vehicle } from '../entities/vehicle.entity.js';

export class VehicleResponseDto {
  @ApiProperty({ example: 17, description: 'Vehicle identifier.' })
  id: number;

  @ApiProperty({ example: 'ABC-123', maxLength: 15 })
  plate: string;

  @ApiProperty({ example: 'Toyota', maxLength: 80 })
  make: string;

  @ApiProperty({ example: 'Corolla', maxLength: 100 })
  model: string;

  @ApiProperty({ example: 2022, minimum: 1886 })
  year: number;

  @ApiProperty({ example: 45200, minimum: 0, description: 'Mileage in kilometers.' })
  mileage: number;

  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  constructor(vehicle: Vehicle) {
    this.id = vehicle.id;
    this.plate = vehicle.plate;
    this.make = vehicle.make;
    this.model = vehicle.model;
    this.year = vehicle.year;
    this.mileage = vehicle.mileage;
    this.status = vehicle.status;
    this.createdAt = vehicle.createdAt;
    this.updatedAt = vehicle.updatedAt;
  }
}
