import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { CreateVehicleDto } from '../dtos/create-vehicle.dto.js';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto.js';
import { VehicleResponseDto } from '../dtos/vehicle-response.dto.js';
import { VehicleStatus } from '../entities/vehicle-status.enum.js';
import { VehiclesService } from '../services/vehicles.service.js';

@ApiTags('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a vehicle.',
    description: 'Administrator-only; requires the access cookie from login.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['plate', 'make', 'model', 'year', 'mileage'],
      properties: {
        plate: { type: 'string', minLength: 2, maxLength: 15, example: 'ABC-123' },
        make: { type: 'string', minLength: 1, maxLength: 80, example: 'Toyota' },
        model: { type: 'string', minLength: 1, maxLength: 100, example: 'Corolla' },
        year: { type: 'integer', minimum: 1886, maximum: new Date().getFullYear() + 1, example: 2022 },
        mileage: { type: 'integer', minimum: 0, example: 45200, description: 'Mileage in kilometers.' },
        status: { type: 'string', enum: Object.values(VehicleStatus), default: VehicleStatus.AVAILABLE },
      },
    },
  })
  @ApiCreatedResponse({ description: 'The vehicle was created.', type: VehicleResponseDto })
  @ApiBadRequestResponse({ description: 'The request body is invalid.' })
  @ApiConflictResponse({ description: 'An active vehicle already uses this plate.' })
  @ApiUnauthorizedResponse({ description: 'The access cookie is missing, invalid, expired, or revoked.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage vehicles.' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active vehicles.', description: 'Administrator-only.' })
  @ApiOkResponse({ description: 'Active vehicles.', type: VehicleResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'The access cookie is missing, invalid, expired, or revoked.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage vehicles.' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an active vehicle by its identifier.', description: 'Administrator-only.' })
  @ApiParam({ name: 'id', type: Number, example: 17 })
  @ApiOkResponse({ description: 'The requested vehicle.', type: VehicleResponseDto })
  @ApiBadRequestResponse({ description: 'The ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The vehicle does not exist or is deleted.' })
  @ApiUnauthorizedResponse({ description: 'The access cookie is missing, invalid, expired, or revoked.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage vehicles.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle.', description: 'Administrator-only. Send at least one field.' })
  @ApiParam({ name: 'id', type: Number, example: 17 })
  @ApiBody({
    schema: {
      type: 'object',
      minProperties: 1,
      additionalProperties: false,
      properties: {
        plate: { type: 'string', minLength: 2, maxLength: 15, example: 'ABC-123' },
        make: { type: 'string', minLength: 1, maxLength: 80, example: 'Toyota' },
        model: { type: 'string', minLength: 1, maxLength: 100, example: 'Corolla' },
        year: { type: 'integer', minimum: 1886, maximum: new Date().getFullYear() + 1, example: 2022 },
        mileage: { type: 'integer', minimum: 0, example: 45200 },
        status: { type: 'string', enum: Object.values(VehicleStatus) },
      },
    },
  })
  @ApiOkResponse({ description: 'The vehicle was updated.', type: VehicleResponseDto })
  @ApiBadRequestResponse({ description: 'The ID or request body is invalid.' })
  @ApiConflictResponse({ description: 'An active vehicle already uses this plate.' })
  @ApiNotFoundResponse({ description: 'The vehicle does not exist or is deleted.' })
  @ApiUnauthorizedResponse({ description: 'The access cookie is missing, invalid, expired, or revoked.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage vehicles.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a vehicle.', description: 'Administrator-only; can be restored later.' })
  @ApiParam({ name: 'id', type: Number, example: 17 })
  @ApiOkResponse({
    description: 'The vehicle was soft-deleted.',
    schema: { type: 'object', properties: { status: { type: 'string', example: 'deleted' } }, required: ['status'] },
  })
  @ApiBadRequestResponse({ description: 'The ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The vehicle does not exist or is already deleted.' })
  @ApiUnauthorizedResponse({ description: 'The access cookie is missing, invalid, expired, or revoked.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage vehicles.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore a soft-deleted vehicle.',
    description: 'Administrator-only. A plate must not be used by another active vehicle.',
  })
  @ApiParam({ name: 'id', type: Number, example: 17 })
  @ApiOkResponse({ description: 'The vehicle was restored.', type: VehicleResponseDto })
  @ApiBadRequestResponse({ description: 'The ID must be an integer.' })
  @ApiConflictResponse({ description: 'Another active vehicle already uses this plate.' })
  @ApiNotFoundResponse({ description: 'The deleted vehicle does not exist.' })
  @ApiUnauthorizedResponse({ description: 'The access cookie is missing, invalid, expired, or revoked.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage vehicles.' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.restore(id);
  }
}
