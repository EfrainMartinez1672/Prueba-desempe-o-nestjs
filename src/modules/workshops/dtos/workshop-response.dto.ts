import { ApiProperty } from '@nestjs/swagger';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';
import { Workshop } from '../entities/workshop.entity.js';

export class WorkshopResponseDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'Central Workshop', maxLength: 120 })
  name: string;

  @ApiProperty({ example: '123 Main Street, Springfield', maxLength: 300 })
  address: string;

  @ApiProperty({ enum: WorkshopStatus, example: WorkshopStatus.ACTIVE })
  status: WorkshopStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  constructor(workshop: Workshop) {
    this.id = workshop.id;
    this.name = workshop.name;
    this.address = workshop.address;
    this.status = workshop.status;
    this.createdAt = workshop.createdAt;
    this.updatedAt = workshop.updatedAt;
  }
}
