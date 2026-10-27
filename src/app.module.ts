import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import databaseConfig from './config/database.config.js';
import { HealthModule } from './infrastructure/health/health.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { MaintenancesModule } from './modules/maintenances/maintenances.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { WorkshopsModule } from './modules/workshops/workshops.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').optional(),
        PORT: Joi.number().port().default(3000),
        API_PREFIX: Joi.string().default('api/v2'),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().port().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_DATABASE: Joi.string().required(),
        DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().port().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        JWT_SECRET: Joi.string().min(32).required(),
        REFRESH_SECRET: Joi.string().min(32).required().invalid(Joi.ref('JWT_SECRET')),
        JWT_EXPIRES_IN_SECONDS: Joi.number().integer().positive().default(900),
        REFRESH_EXPIRES_IN_SECONDS: Joi.number().integer().positive().default(604800),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: ReturnType<typeof databaseConfig>) => config,
    }),
    HealthModule,
    RedisModule,
    UsersModule,
    VehiclesModule,
    WorkshopsModule,
    MaintenancesModule,
  ],
})
export class AppModule {}
