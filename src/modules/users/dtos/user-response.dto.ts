import { UserRole } from '../entities/user-role.enum.js';
import { User } from '../entities/user.entity.js';

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  specialty: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.specialty = user.technicianProfile?.specialty ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
