import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { WorkshopStatus } from './workshop-status.enum.js';

@Entity({ name: 'workshops' })
@Index('UQ_workshops_active_name', ['name'], { unique: true, where: '"status" = \'ACTIVE\'' })
export class Workshop {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 300 })
  address!: string;

  @Column({ type: 'enum', enum: WorkshopStatus, enumName: 'workshops_status_enum', default: WorkshopStatus.ACTIVE })
  status!: WorkshopStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
