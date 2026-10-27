import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { WorkshopsController } from './controllers/workshops.controller.js';
import { WorkshopDao } from './dao/workshop.dao.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopsService } from './services/workshops.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop]), AuthModule, UsersModule],
  controllers: [WorkshopsController],
  providers: [WorkshopDao, WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
