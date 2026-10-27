import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { VehicleDao } from '../dao/vehicle.dao.js';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto.js';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto.js';
import { VehicleResponseDto } from '../dtos/vehicle-response.dto.js';
import { Vehicle } from '../entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly vehicleDao: VehicleDao) {}

  async create(dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const plate = this.normalizePlate(dto.plate);
    if (await this.vehicleDao.existsActivePlate(plate)) {
      throw new ConflictException('An active vehicle with this plate already exists.');
    }

    return this.saveVehicle(this.vehicleDao.create({ ...dto, plate }));
  }

  async findAll(): Promise<VehicleResponseDto[]> {
    return (await this.vehicleDao.findAll()).map((vehicle) => new VehicleResponseDto(vehicle));
  }

  async findOne(id: number): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleDao.findById(id);
    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    return new VehicleResponseDto(vehicle);
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = await this.getVehicleOrFail(id);
    const plate = dto.plate === undefined ? undefined : this.normalizePlate(dto.plate);
    if (plate !== undefined && (await this.vehicleDao.existsActivePlate(plate, id))) {
      throw new ConflictException('An active vehicle with this plate already exists.');
    }

    Object.assign(vehicle, { ...dto, ...(plate === undefined ? {} : { plate }) });
    return this.saveVehicle(vehicle);
  }

  async remove(id: number): Promise<{ status: 'deleted' }> {
    const deleted = await this.vehicleDao.softDelete(id);
    if (!deleted) throw new NotFoundException('Vehicle not found or already deleted.');
    return { status: 'deleted' };
  }

  async restore(id: number): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleDao.findDeletedById(id);
    if (!vehicle) throw new NotFoundException('Deleted vehicle not found.');
    if (await this.vehicleDao.existsActivePlate(vehicle.plate, id)) {
      throw new ConflictException(
        'Another active vehicle already uses this plate. Update that vehicle or change its plate before restoring.',
      );
    }
    await this.vehicleDao.restore(id);
    const restoredVehicle = await this.vehicleDao.findById(id);
    if (!restoredVehicle) throw new NotFoundException('Vehicle could not be restored.');
    return new VehicleResponseDto(restoredVehicle);
  }

  private async getVehicleOrFail(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleDao.findById(id);
    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    return vehicle;
  }

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase();
  }

  private async saveVehicle(vehicle: Vehicle): Promise<VehicleResponseDto> {
    try {
      return new VehicleResponseDto(await this.vehicleDao.save(vehicle));
    } catch (error) {
      if (this.isDuplicatePlateError(error)) {
        throw new ConflictException('An active vehicle with this plate already exists.');
      }
      throw error;
    }
  }

  private isDuplicatePlateError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
