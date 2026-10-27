import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicianProfile } from '../entities/technician-profile.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UserDao {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    @InjectRepository(TechnicianProfile) private readonly profileRepository: Repository<TechnicianProfile>,
  ) {}

  create(user: Partial<User>): User {
    return this.repository.create(user);
  }

  save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.repository.find({ relations: { technicianProfile: true }, order: { id: 'ASC' } });
  }

  findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id }, relations: { technicianProfile: true } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.technicianProfile', 'technicianProfile')
      .where('user.email = :email', { email })
      .getOne();
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return Boolean(result.affected);
  }

  async deleteTechnicianProfile(id: number): Promise<void> {
    await this.profileRepository.delete(id);
  }
}
