import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UsersController } from './controllers/users.controller.js';
import { UserDao } from './dao/user.dao.js';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './services/users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, TechnicianProfile]), forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UserDao, UsersService, RolesGuard],
  exports: [UserDao, UsersService],
})
export class UsersModule {}
