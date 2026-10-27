import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkshopDao } from '../dao/workshop.dao.js';
import { CreateWorkshopDto } from '../dtos/create-workshop.dto.js';
import { UpdateWorkshopStatusDto } from '../dtos/update-workshop-status.dto.js';
import { WorkshopResponseDto } from '../dtos/workshop-response.dto.js';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';
import { Workshop } from '../entities/workshop.entity.js';

@Injectable()
export class WorkshopsService {
  constructor(private readonly workshopDao: WorkshopDao) {}

  async create(dto: CreateWorkshopDto): Promise<WorkshopResponseDto> {
    const name = this.normalizeName(dto.name);
    if (dto.status === WorkshopStatus.ACTIVE && (await this.workshopDao.existsActiveName(name))) {
      throw new ConflictException('An active workshop with this name already exists.');
    }
    return this.saveWorkshop(this.workshopDao.create({ ...dto, name }));
  }

  async findActive(): Promise<WorkshopResponseDto[]> {
    return (await this.workshopDao.findActive()).map((workshop) => new WorkshopResponseDto(workshop));
  }

  async findOne(id: number): Promise<WorkshopResponseDto> {
    const workshop = await this.workshopDao.findById(id);
    if (!workshop) throw new NotFoundException('Workshop not found.');
    return new WorkshopResponseDto(workshop);
  }

  async updateStatus(id: number, dto: UpdateWorkshopStatusDto): Promise<WorkshopResponseDto> {
    const workshop = await this.getWorkshopOrFail(id);
    if (dto.status === WorkshopStatus.ACTIVE && (await this.workshopDao.existsActiveName(workshop.name, id))) {
      throw new ConflictException('Another active workshop already uses this name.');
    }
    workshop.status = dto.status;
    return this.saveWorkshop(workshop);
  }

  async assertCanAssignMaintenance(workshopId: number): Promise<void> {
    const workshop = await this.workshopDao.findById(workshopId);
    if (!workshop || workshop.status !== WorkshopStatus.ACTIVE) {
      throw new ConflictException('Maintenance can only be assigned to an existing active workshop.');
    }
  }

  private async getWorkshopOrFail(id: number): Promise<Workshop> {
    const workshop = await this.workshopDao.findById(id);
    if (!workshop) throw new NotFoundException('Workshop not found.');
    return workshop;
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private async saveWorkshop(workshop: Workshop): Promise<WorkshopResponseDto> {
    try {
      return new WorkshopResponseDto(await this.workshopDao.save(workshop));
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new ConflictException('An active workshop with this name already exists.');
      }
      throw error;
    }
  }

  private isDuplicateNameError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
