import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
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
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';
import { UserRole } from '../entities/user-role.enum.js';
import { UsersService } from '../services/users.service.js';

@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a user account.',
    description: 'Administrator-only. Technicians must have a specialty; admins must not.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 120, example: 'Jordan Smith' },
        email: { type: 'string', format: 'email', maxLength: 254, example: 'jordan@example.com' },
        password: { type: 'string', minLength: 8, maxLength: 72, example: 'a-strong-password' },
        role: { type: 'string', enum: Object.values(UserRole), example: UserRole.TECHNICIAN },
        specialty: { type: 'string', minLength: 1, maxLength: 120, example: 'Electrical systems' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'The account was created.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'The request body is invalid or violates account rules.' })
  @ApiConflictResponse({ description: 'An account with the email already exists.' })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can create accounts.' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all user accounts.', description: 'Administrator-only.' })
  @ApiOkResponse({ description: 'The account list.', type: UserResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can list accounts.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user account by ID.', description: 'Administrator-only.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID.', example: 42 })
  @ApiOkResponse({ description: 'The requested account.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'The ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The account does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can view accounts.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user account.',
    description: 'Administrator-only. Send at least one field. Setting specialty to null removes a technician profile.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      minProperties: 1,
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 120, example: 'Jordan Smith' },
        email: { type: 'string', format: 'email', maxLength: 254, example: 'jordan@example.com' },
        password: { type: 'string', minLength: 8, maxLength: 72, example: 'another-strong-password' },
        role: { type: 'string', enum: Object.values(UserRole), example: UserRole.TECHNICIAN },
        specialty: { type: 'string', nullable: true, minLength: 1, maxLength: 120, example: 'HVAC' },
      },
      additionalProperties: false,
    },
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID.', example: 42 })
  @ApiOkResponse({ description: 'The updated account.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'The request is invalid or violates account rules.' })
  @ApiConflictResponse({ description: 'An account with the email already exists.' })
  @ApiNotFoundResponse({ description: 'The account does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can update accounts.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a user account.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID.', example: 42 })
  @ApiOkResponse({
    description: 'The account was soft-deleted.',
    schema: { type: 'object', properties: { status: { type: 'string', example: 'deleted' } }, required: ['status'] },
  })
  @ApiBadRequestResponse({ description: 'The ID must be an integer.' })
  @ApiNotFoundResponse({ description: 'The account does not exist.' })
  @ApiUnauthorizedResponse({ description: 'A valid access token is required.' })
  @ApiForbiddenResponse({ description: 'Only administrators can delete accounts.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
