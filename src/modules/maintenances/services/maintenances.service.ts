import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user-role.enum.js';
import { UserStatus } from '../../users/entities/user-status.enum.js';
import type { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/services/users.service.js';
import { VehicleStatus } from '../../vehicles/entities/vehicle-status.enum.js';
import type { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { VehiclesService } from '../../vehicles/services/vehicles.service.js';
import type { Workshop } from '../../workshops/entities/workshop.entity.js';
import { WorkshopsService } from '../../workshops/services/workshops.service.js';
import { MaintenanceDao } from '../dao/maintenance.dao.js';
import { CreateMaintenanceDto } from '../dtos/create-maintenance.dto.js';
import { MaintenanceResponseDto } from '../dtos/maintenance-response.dto.js';
import { UpdateMaintenanceStatusDto } from '../dtos/update-maintenance-status.dto.js';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';
import { Maintenance } from '../entities/maintenance.entity.js';

@Injectable()
export class MaintenancesService {
  constructor(
    private readonly maintenanceDao: MaintenanceDao,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(dto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
    this.validateScheduleWindow(dto.scheduledAt, dto.scheduledEndAt);
    const [vehicle, mechanic] = await Promise.all([
      this.vehiclesService.findOne(dto.vehicleId),
      this.usersService.findOne(dto.mechanicId),
      this.workshopsService.assertCanAssignMaintenance(dto.workshopId),
    ]);

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException('Maintenance cannot be assigned to an inactive vehicle.');
    }
    if (mechanic.role !== UserRole.TECHNICIAN || mechanic.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Maintenance must be assigned to an active technician.');
    }
    if (dto.mileage < vehicle.mileage) {
      throw new BadRequestException('Maintenance mileage cannot be lower than the vehicle mileage.');
    }
    if (await this.maintenanceDao.hasMechanicScheduleOverlap(dto.mechanicId, dto.scheduledAt, dto.scheduledEndAt)) {
      throw new ConflictException('The technician already has maintenance scheduled during this time period.');
    }
    if (await this.maintenanceDao.hasVehicleScheduleOverlap(dto.vehicleId, dto.scheduledAt, dto.scheduledEndAt)) {
      throw new ConflictException('The vehicle already has maintenance scheduled during this time period.');
    }

    const maintenance = this.maintenanceDao.create({
      type: dto.type,
      description: dto.description,
      mileage: dto.mileage,
      scheduledAt: dto.scheduledAt,
      scheduledEndAt: dto.scheduledEndAt,
      status: MaintenanceStatus.SCHEDULED,
      vehicle: { id: dto.vehicleId } as Vehicle,
      mechanic: { id: dto.mechanicId } as User,
      workshop: { id: dto.workshopId } as Workshop,
      workPerformed: null,
      finalCost: null,
      completedAt: null,
      finalMileage: null,
    });
    return this.saveMaintenance(maintenance);
  }

  async findAll(): Promise<MaintenanceResponseDto[]> {
    return (await this.maintenanceDao.findAll()).map((item) => new MaintenanceResponseDto(item));
  }

  async findActive(): Promise<MaintenanceResponseDto[]> {
    return (await this.maintenanceDao.findActive()).map((item) => new MaintenanceResponseDto(item));
  }

  async findOne(id: number): Promise<MaintenanceResponseDto> {
    const maintenance = await this.maintenanceDao.findById(id);
    if (!maintenance) throw new NotFoundException('Maintenance not found.');
    return new MaintenanceResponseDto(maintenance);
  }

  async findByVehicle(vehicleId: number): Promise<MaintenanceResponseDto[]> {
    await this.vehiclesService.findOne(vehicleId);
    return (await this.maintenanceDao.findByVehicle(vehicleId)).map((item) => new MaintenanceResponseDto(item));
  }

  async findByMechanic(mechanicId: number): Promise<MaintenanceResponseDto[]> {
    const mechanic = await this.usersService.findOne(mechanicId);
    if (mechanic.role !== UserRole.TECHNICIAN) throw new NotFoundException('Technician not found.');
    return (await this.maintenanceDao.findByMechanic(mechanicId)).map((item) => new MaintenanceResponseDto(item));
  }

  async findVehicleHistory(vehicleId: number): Promise<MaintenanceResponseDto[]> {
    await this.vehiclesService.findOne(vehicleId);
    return (await this.maintenanceDao.findVehicleHistory(vehicleId)).map((item) => new MaintenanceResponseDto(item));
  }

  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto): Promise<MaintenanceResponseDto> {
    const maintenance = await this.maintenanceDao.findById(id);
    if (!maintenance) throw new NotFoundException('Maintenance not found.');
    const previousStatus = maintenance.status;
    if ([MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED].includes(previousStatus)) {
      throw new ConflictException(`Maintenance in ${previousStatus} status cannot be changed.`);
    }

    const allowedTransitions: Record<MaintenanceStatus, readonly MaintenanceStatus[]> = {
      [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
      [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
      [MaintenanceStatus.COMPLETED]: [],
      [MaintenanceStatus.CANCELLED]: [],
    };
    if (!allowedTransitions[previousStatus].includes(dto.status)) {
      throw new ConflictException(`Invalid maintenance status transition: ${previousStatus} -> ${dto.status}.`);
    }

    if (dto.status === MaintenanceStatus.IN_PROGRESS && maintenance.vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException('Maintenance cannot start because its vehicle is inactive.');
    }

    if (
      [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS].includes(dto.status) &&
      (await this.maintenanceDao.hasMechanicScheduleOverlap(
        maintenance.mechanic.id,
        maintenance.scheduledAt,
        maintenance.scheduledEndAt,
        maintenance.id,
      ))
    ) {
      throw new ConflictException('The technician already has maintenance scheduled during this time period.');
    }
    if (
      [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS].includes(dto.status) &&
      (await this.maintenanceDao.hasVehicleScheduleOverlap(
        maintenance.vehicle.id,
        maintenance.scheduledAt,
        maintenance.scheduledEndAt,
        maintenance.id,
      ))
    ) {
      throw new ConflictException('The vehicle already has maintenance scheduled during this time period.');
    }

    if (dto.status === MaintenanceStatus.COMPLETED) {
      if (
        dto.workPerformed === undefined ||
        dto.finalCost === undefined ||
        dto.completedAt === undefined ||
        dto.finalMileage === undefined
      ) {
        throw new BadRequestException('Work performed, final cost, completion date, and final mileage are required.');
      }
      if (dto.finalMileage < maintenance.mileage) {
        throw new BadRequestException('Final mileage cannot be lower than the scheduled maintenance mileage.');
      }
      maintenance.workPerformed = dto.workPerformed;
      maintenance.finalCost = dto.finalCost.toFixed(2);
      maintenance.completedAt = dto.completedAt;
      maintenance.finalMileage = dto.finalMileage;
    }

    maintenance.status = dto.status;
    let vehicleUpdate: { status: VehicleStatus; mileage?: number } | undefined;
    if (dto.status === MaintenanceStatus.IN_PROGRESS) {
      vehicleUpdate = { status: VehicleStatus.IN_MAINTENANCE };
    } else if (dto.status === MaintenanceStatus.COMPLETED) {
      vehicleUpdate = { status: VehicleStatus.AVAILABLE, mileage: dto.finalMileage };
    } else if (
      dto.status === MaintenanceStatus.CANCELLED &&
      previousStatus === MaintenanceStatus.IN_PROGRESS &&
      maintenance.vehicle.status === VehicleStatus.IN_MAINTENANCE
    ) {
      vehicleUpdate = { status: VehicleStatus.AVAILABLE };
    }
    return this.saveMaintenance(maintenance, vehicleUpdate);
  }

  private validateScheduleWindow(start: Date, end: Date): void {
    if (end <= start) {
      throw new BadRequestException('Scheduled end must be later than scheduled start.');
    }
  }

  private async saveMaintenance(
    maintenance: Maintenance,
    vehicleUpdate?: { status: VehicleStatus; mileage?: number },
  ): Promise<MaintenanceResponseDto> {
    try {
      const saved = vehicleUpdate
        ? await this.maintenanceDao.saveAndUpdateVehicle(maintenance, vehicleUpdate)
        : await this.maintenanceDao.save(maintenance);
      return new MaintenanceResponseDto(saved);
    } catch (error) {
      if (this.isScheduleExclusionError(error)) {
        throw new ConflictException('The technician already has maintenance scheduled during this time period.');
      }
      throw error;
    }
  }

  private isScheduleExclusionError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23P01';
  }
}
