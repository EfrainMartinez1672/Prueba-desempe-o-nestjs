import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';
import { Workshop } from '../entities/workshop.entity.js';

@Injectable()
export class WorkshopDao {
  constructor(@InjectRepository(Workshop) private readonly repository: Repository<Workshop>) {}

  create(fields: Partial<Workshop>): Workshop {
    return this.repository.create(fields);
  }

  save(workshop: Workshop): Promise<Workshop> {
    return this.repository.save(workshop);
  }

  findActive(): Promise<Workshop[]> {
    return this.repository.find({ where: { status: WorkshopStatus.ACTIVE }, order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Workshop | null> {
    return this.repository.findOne({ where: { id } });
  }

  existsActiveName(name: string, exceptId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('workshop')
      .where('LOWER(workshop.name) = LOWER(:name)', { name })
      .andWhere('workshop.status = :status', { status: WorkshopStatus.ACTIVE });
    if (exceptId !== undefined) query.andWhere('workshop.id <> :exceptId', { exceptId });
    return query.getExists();
  }
}
