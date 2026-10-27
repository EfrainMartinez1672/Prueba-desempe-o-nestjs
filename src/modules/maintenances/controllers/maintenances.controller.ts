import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../auth/guards/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../users/entities/user-role.enum.js';
import { CreateMaintenanceDto } from '../dtos/create-maintenance.dto.js';
import { MaintenanceResponseDto } from '../dtos/maintenance-response.dto.js';
import { UpdateMaintenanceStatusDto } from '../dtos/update-maintenance-status.dto.js';
import { MaintenanceStatus } from '../entities/maintenance-status.enum.js';
import { MaintenancesService } from '../services/maintenances.service.js';
import { ApiKeyAuth } from '../decoradores/api-key-auth.decorator.js';

@ApiTags('maintenances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @ApiKeyAuth()
  @ApiOperation({
    summary: 'Schedule maintenance.',
    description: 'Administrator-only. Vehicle, active technician, and active workshop must exist.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'type',
        'description',
        'mileage',
        'scheduledAt',
        'scheduledEndAt',
        'vehicleId',
        'mechanicId',
        'workshopId',
      ],
      properties: {
        type: { type: 'string', enum: ['PREVENTIVE', 'CORRECTIVE'], example: 'PREVENTIVE' },
        description: { type: 'string', maxLength: 5000, example: 'Oil and filter change' },
        mileage: { type: 'integer', minimum: 0, example: 45200 },
        scheduledAt: { type: 'string', format: 'date-time', example: '2026-11-01T10:00:00Z' },
        scheduledEndAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-11-01T11:00:00Z',
          description: 'Required planned end. Active technician assignments cannot overlap.',
        },
        vehicleId: { type: 'integer', example: 17 },
        mechanicId: { type: 'integer', example: 12 },
        workshopId: { type: 'integer', example: 4 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Maintenance was scheduled in SCHEDULED status.', type: MaintenanceResponseDto })
  @ApiBadRequestResponse({ description: 'The request body or mileage is invalid.' })
  @ApiConflictResponse({
    description: 'A related resource is inactive, or the technician already has an overlapping maintenance.',
  })
  @ApiNotFoundResponse({ description: 'A related vehicle, mechanic, or workshop does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all maintenance records.', description: 'Administrator-only.' })
  @ApiOkResponse({ type: MaintenanceResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  findAll() {
    return this.maintenancesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'List active maintenance records (SCHEDULED or IN_PROGRESS).' })
  @ApiOkResponse({ type: MaintenanceResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('vehicle/:vehicleId/history')
  @ApiOperation({
    summary: 'Get complete maintenance history for a vehicle, including completed and cancelled records.',
  })
  @ApiParam({ name: 'vehicleId', type: Number, example: 17 })
  @ApiOkResponse({ type: MaintenanceResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'The vehicle ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The vehicle does not exist or is inactive.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  findVehicleHistory(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findVehicleHistory(vehicleId);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'List maintenance records for a vehicle.' })
  @ApiParam({ name: 'vehicleId', type: Number, example: 17 })
  @ApiOkResponse({ type: MaintenanceResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'The vehicle ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The vehicle does not exist or is inactive.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @ApiOperation({ summary: 'List maintenance assigned to a mechanic.' })
  @ApiParam({ name: 'mechanicId', type: Number, example: 12 })
  @ApiOkResponse({ type: MaintenanceResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'The mechanic ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The mechanic is not a technician.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance by ID.' })
  @ApiParam({ name: 'id', type: Number, example: 100 })
  @ApiOkResponse({ type: MaintenanceResponseDto })
  @ApiBadRequestResponse({ description: 'The maintenance ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'Maintenance does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maintenancesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update maintenance status. Completion requires all closeout fields; CANCELLED and COMPLETED are terminal.',
  })
  @ApiParam({ name: 'id', type: Number, example: 100 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: Object.values(MaintenanceStatus) },
        workPerformed: { type: 'string', maxLength: 10000, example: 'Replaced oil and filter.' },
        finalCost: { type: 'number', minimum: 0, example: 275.5 },
        completedAt: { type: 'string', format: 'date-time', example: '2026-11-01T11:15:00Z' },
        finalMileage: { type: 'integer', minimum: 0, example: 45300 },
      },
    },
  })
  @ApiOkResponse({ type: MaintenanceResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid status or required completion information is missing.' })
  @ApiConflictResponse({ description: 'Completed or cancelled maintenance is final and cannot change status.' })
  @ApiNotFoundResponse({ description: 'Maintenance does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage maintenance.' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaintenanceStatusDto) {
    return this.maintenancesService.updateStatus(id, dto);
  }
}
