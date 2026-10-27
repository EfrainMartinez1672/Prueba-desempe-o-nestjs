import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { RegisterDto } from '../../auth/dtos/auth.dto.js';
import { UserDao } from '../dao/user.dao.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';
import { TechnicianProfile } from '../entities/technician-profile.entity.js';
import { UserRole } from '../entities/user-role.enum.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(private readonly userDao: UserDao) {}

  async create(dto: RegisterDto): Promise<UserResponseDto> {
    const user = this.userDao.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await hash(dto.password, 12),
      role: UserRole.TECHNICIAN,
    });
    user.technicianProfile = this.createProfile(dto.specialty, user);
    return this.saveUser(user);
  }

  async createByAdmin(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = this.userDao.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await hash(dto.password, 12),
      role: dto.role,
    });
    if (dto.specialty) user.technicianProfile = this.createProfile(dto.specialty, user);
    return this.saveUser(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    return (await this.userDao.findAll()).map((user) => new UserResponseDto(user));
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userDao.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    return new UserResponseDto(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.getUserOrFail(id);
    const updatedRole = dto.role ?? user.role;

    if (
      updatedRole === UserRole.TECHNICIAN &&
      (dto.specialty === null || (!dto.specialty && !user.technicianProfile))
    ) {
      throw new BadRequestException('Technicians must have a specialty.');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.password !== undefined) user.passwordHash = await hash(dto.password, 12);
    if (dto.role !== undefined) user.role = dto.role;

    if (user.role === UserRole.ADMIN || dto.specialty === null) {
      if (user.technicianProfile) await this.userDao.deleteTechnicianProfile(user.technicianProfile.id);
      user.technicianProfile = null;
    } else if (dto.specialty !== undefined) {
      if (user.technicianProfile) {
        user.technicianProfile.specialty = dto.specialty;
      } else {
        user.technicianProfile = this.createProfile(dto.specialty, user);
      }
    }

    return this.saveUser(user);
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.userDao.softDelete(id);
    if (!deleted) throw new NotFoundException('User not found.');
  }

  private async getUserOrFail(id: number): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  private createProfile(specialty: string, user: User): TechnicianProfile {
    return Object.assign(new TechnicianProfile(), { specialty, user });
  }

  private async saveUser(user: User): Promise<UserResponseDto> {
    try {
      return new UserResponseDto(await this.userDao.save(user));
    } catch (error) {
      if (this.isDuplicateEmailError(error)) throw new ConflictException('An account with this email already exists.');
      throw error;
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
