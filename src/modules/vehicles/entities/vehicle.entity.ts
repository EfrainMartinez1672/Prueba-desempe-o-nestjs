import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleStatus } from './vehicle-status.enum.js';

@Entity({ name: 'vehicles' })
@Index('UQ_vehicles_active_plate', ['plate'], { unique: true, where: '"deleted_at" IS NULL' })
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 15 })
  plate!: string;

  @Column({ type: 'varchar', length: 80 })
  make!: string;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'smallint' })
  year!: number;

  @Column({ type: 'integer' })
  mileage!: number;

  @Column({ type: 'enum', enum: VehicleStatus, enumName: 'vehicles_status_enum', default: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
