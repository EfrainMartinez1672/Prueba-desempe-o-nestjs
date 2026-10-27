import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user-role.enum.js';
import { UserStatus } from '../entities/user-status.enum.js';
import { User } from '../entities/user.entity.js';

export class UserResponseDto {
  @ApiProperty({ example: 42, description: 'Unique user ID.' })
  id: number;

  @ApiProperty({ example: 'Jordan Smith', maxLength: 120 })
  name: string;

  @ApiProperty({ example: 'jordan@example.com', maxLength: 254 })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TECHNICIAN })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: 'Electrical systems', nullable: true, description: 'Null for administrator accounts.' })
  specialty: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.specialty = user.technicianProfile?.specialty ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
