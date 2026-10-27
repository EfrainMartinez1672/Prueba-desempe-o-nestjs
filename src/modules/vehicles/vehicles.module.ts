import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { VehiclesController } from './controllers/vehicles.controller.js';
import { VehicleDao } from './dao/vehicle.dao.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesService } from './services/vehicles.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle]), AuthModule, UsersModule],
  controllers: [VehiclesController],
  providers: [VehicleDao, VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
