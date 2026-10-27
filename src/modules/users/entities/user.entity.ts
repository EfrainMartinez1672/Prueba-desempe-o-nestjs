import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TechnicianProfile } from './technician-profile.entity.js';
import { UserRole } from './user-role.enum.js';
import { UserStatus } from './user-status.enum.js';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TECHNICIAN })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, enumName: 'users_status_enum', default: UserStatus.ACTIVE })
  status!: UserStatus;

  @OneToOne(() => TechnicianProfile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  technicianProfile?: TechnicianProfile | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
