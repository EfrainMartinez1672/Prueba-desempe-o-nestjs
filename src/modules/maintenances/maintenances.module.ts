import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';
import { MaintenancesController } from './controllers/maintenances.controller.js';
import { MaintenanceDao } from './dao/maintenance.dao.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesService } from './services/maintenances.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance]), AuthModule, UsersModule, VehiclesModule, WorkshopsModule],
  controllers: [MaintenancesController],
  providers: [MaintenanceDao, MaintenancesService],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
