import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';
import { MaintenanceStatus } from './maintenance-status.enum.js';
import { MaintenanceType } from './maintenance-type.enum.js';

@Entity({ name: 'maintenances' })
export class Maintenance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: MaintenanceType, enumName: 'maintenances_type_enum' })
  type!: MaintenanceType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer' })
  mileage!: number;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'scheduled_end_at', type: 'timestamptz' })
  scheduledEndAt!: Date;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'maintenances_status_enum',
    default: MaintenanceStatus.SCHEDULED,
  })
  status!: MaintenanceStatus;

  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed!: string | null;

  @Column({ name: 'final_cost', type: 'numeric', precision: 12, scale: 2, nullable: true })
  finalCost!: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'final_mileage', type: 'integer', nullable: true })
  finalMileage!: number | null;

  @ManyToOne(() => Vehicle, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mechanic_id' })
  mechanic!: User;

  @ManyToOne(() => Workshop, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop!: Workshop;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
