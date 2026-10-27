import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto.js';
import { VehicleResponseDto } from '../../vehicles/dtos/vehicle-response.dto.js';
import { WorkshopResponseDto } from '../../workshops/dtos/workshop-response.dto.js';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';
import { MaintenanceType } from '../entities/maintenance-type.enum.js';
import { Maintenance } from '../entities/maintenance.entity.js';

export class MaintenanceResponseDto {
  @ApiProperty({ example: 100 })
  id: number;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  type: MaintenanceType;

  @ApiProperty({ example: 'Oil and filter change' })
  description: string;

  @ApiProperty({ example: 45200, minimum: 0 })
  mileage: number;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt: Date;

  @ApiProperty({ type: String, format: 'date-time', description: 'Planned end of the mechanic time slot.' })
  scheduledEndAt: Date;

  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.SCHEDULED })
  status: MaintenanceStatus;

  @ApiProperty({ type: String, nullable: true })
  workPerformed: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 275.5 })
  finalCost: number | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: Number, nullable: true, example: 45300 })
  finalMileage: number | null;

  @ApiProperty({ type: () => VehicleResponseDto })
  vehicle: VehicleResponseDto;

  @ApiProperty({ type: () => UserResponseDto })
  mechanic: UserResponseDto;

  @ApiProperty({ type: () => WorkshopResponseDto })
  workshop: WorkshopResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  constructor(maintenance: Maintenance) {
    this.id = maintenance.id;
    this.type = maintenance.type;
    this.description = maintenance.description;
    this.mileage = maintenance.mileage;
    this.scheduledAt = maintenance.scheduledAt;
    this.scheduledEndAt = maintenance.scheduledEndAt;
    this.status = maintenance.status;
    this.workPerformed = maintenance.workPerformed;
    this.finalCost = maintenance.finalCost === null ? null : Number(maintenance.finalCost);
    this.completedAt = maintenance.completedAt;
    this.finalMileage = maintenance.finalMileage;
    this.vehicle = new VehicleResponseDto(maintenance.vehicle);
    this.mechanic = new UserResponseDto(maintenance.mechanic);
    this.workshop = new WorkshopResponseDto(maintenance.workshop);
    this.createdAt = maintenance.createdAt;
    this.updatedAt = maintenance.updatedAt;
  }
}
