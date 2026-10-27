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
import { CreateWorkshopDto } from '../dtos/create-workshop.dto.js';
import { UpdateWorkshopStatusDto } from '../dtos/update-workshop-status.dto.js';
import { WorkshopResponseDto } from '../dtos/workshop-response.dto.js';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';
import { WorkshopsService } from '../services/workshops.service.js';

@ApiTags('workshops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a workshop.', description: 'Administrator-only.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'address'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 120, example: 'Central Workshop' },
        address: { type: 'string', minLength: 1, maxLength: 300, example: '123 Main Street, Springfield' },
        status: { type: 'string', enum: Object.values(WorkshopStatus), default: WorkshopStatus.ACTIVE },
      },
    },
  })
  @ApiCreatedResponse({ description: 'The workshop was registered.', type: WorkshopResponseDto })
  @ApiBadRequestResponse({ description: 'The request body is invalid.' })
  @ApiConflictResponse({ description: 'An active workshop with this name already exists.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage workshops.' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active workshops.', description: 'Administrator-only.' })
  @ApiOkResponse({ description: 'Active workshops.', type: WorkshopResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage workshops.' })
  findActive() {
    return this.workshopsService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a workshop by ID.',
    description: 'Administrator-only; returns active or inactive records.',
  })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiOkResponse({ description: 'The requested workshop.', type: WorkshopResponseDto })
  @ApiBadRequestResponse({ description: 'The ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The workshop does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage workshops.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a workshop.', description: 'Administrator-only.' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: Object.values(WorkshopStatus), example: WorkshopStatus.INACTIVE } },
      additionalProperties: false,
    },
  })
  @ApiOkResponse({ description: 'The workshop status was updated.', type: WorkshopResponseDto })
  @ApiBadRequestResponse({ description: 'The ID or status is invalid.' })
  @ApiConflictResponse({ description: 'Another active workshop already uses this name.' })
  @ApiNotFoundResponse({ description: 'The workshop does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access cookie is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can manage workshops.' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopStatusDto) {
    return this.workshopsService.updateStatus(id, dto);
  }
}
