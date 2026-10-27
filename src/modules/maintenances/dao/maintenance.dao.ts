import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { VehicleStatus } from '../../vehicles/entities/vehicle-status.enum.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';
import { Maintenance } from '../entities/maintenance.entity.js';

const relations = { vehicle: true, mechanic: { technicianProfile: true }, workshop: true } as const;

@Injectable()
export class MaintenanceDao {
  constructor(
    @InjectRepository(Maintenance) private readonly repository: Repository<Maintenance>,
    private readonly dataSource: DataSource,
  ) {}

  create(fields: Partial<Maintenance>): Maintenance {
    return this.repository.create(fields);
  }

  save(maintenance: Maintenance): Promise<Maintenance> {
    return this.repository.save(maintenance);
  }

  findAll(): Promise<Maintenance[]> {
    return this.repository.find({ relations, order: { scheduledAt: 'DESC', id: 'DESC' } });
  }

  findActive(): Promise<Maintenance[]> {
    return this.repository.find({
      where: { status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]) },
      relations,
      order: { scheduledAt: 'ASC', id: 'ASC' },
    });
  }

  findById(id: number): Promise<Maintenance | null> {
    return this.repository.findOne({ where: { id }, relations });
  }

  hasMechanicScheduleOverlap(mechanicId: number, start: Date, end: Date, excludeId?: number): Promise<boolean> {
    const query = this.overlapQuery(start, end).andWhere('maintenance.mechanic_id = :mechanicId', { mechanicId });
    if (excludeId !== undefined) query.andWhere('maintenance.id <> :excludeId', { excludeId });
    return query.getExists();
  }

  hasVehicleScheduleOverlap(vehicleId: number, start: Date, end: Date, excludeId?: number): Promise<boolean> {
    const query = this.overlapQuery(start, end).andWhere('maintenance.vehicle_id = :vehicleId', { vehicleId });
    if (excludeId !== undefined) query.andWhere('maintenance.id <> :excludeId', { excludeId });
    return query.getExists();
  }

  private overlapQuery(start: Date, end: Date) {
    return this.repository
      .createQueryBuilder('maintenance')
      .where('maintenance.status IN (:...statuses)', {
        statuses: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
      })
      .andWhere('maintenance.scheduled_at < :endAt', { endAt: end })
      .andWhere('maintenance.scheduled_end_at > :startAt', { startAt: start });
  }

  saveAndUpdateVehicle(
    maintenance: Maintenance,
    vehicleUpdate: { status: VehicleStatus; mileage?: number } | undefined,
  ): Promise<Maintenance> {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(Maintenance).save(maintenance);
      if (vehicleUpdate) {
        await manager.getRepository(Vehicle).update(maintenance.vehicle.id, vehicleUpdate);
      }
      return manager.getRepository(Maintenance).findOneOrFail({ where: { id: saved.id }, relations });
    });
  }

  findByVehicle(vehicleId: number): Promise<Maintenance[]> {
    return this.repository.find({
      where: { vehicle: { id: vehicleId } },
      relations,
      order: { scheduledAt: 'DESC', id: 'DESC' },
    });
  }

  findByMechanic(mechanicId: number): Promise<Maintenance[]> {
    return this.repository.find({
      where: { mechanic: { id: mechanicId } },
      relations,
      order: { scheduledAt: 'DESC', id: 'DESC' },
    });
  }

  findVehicleHistory(vehicleId: number): Promise<Maintenance[]> {
    return this.findByVehicle(vehicleId);
  }
}
