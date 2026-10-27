import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity.js';

@Injectable()
export class VehicleDao {
  constructor(@InjectRepository(Vehicle) private readonly repository: Repository<Vehicle>) {}

  create(fields: Partial<Vehicle>): Vehicle {
    return this.repository.create(fields);
  }

  save(vehicle: Vehicle): Promise<Vehicle> {
    return this.repository.save(vehicle);
  }

  findAll(): Promise<Vehicle[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Vehicle | null> {
    return this.repository.findOne({ where: { id } });
  }

  findDeletedById(id: number): Promise<Vehicle | null> {
    return this.repository.findOne({ where: { id, deletedAt: Not(IsNull()) }, withDeleted: true });
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return Boolean(result.affected);
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.repository.restore(id);
    return Boolean(result.affected);
  }

  existsActivePlate(plate: string, exceptId?: number): Promise<boolean> {
    const query = this.repository.createQueryBuilder('vehicle').where('vehicle.plate = :plate', { plate });
    if (exceptId !== undefined) query.andWhere('vehicle.id <> :exceptId', { exceptId });
    return query.getExists();
  }
}
