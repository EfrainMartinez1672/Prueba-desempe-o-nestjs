import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard.js';

export const ApiKeyAuth = () =>
  applyDecorators(UseGuards(ApiKeyGuard), ApiSecurity('api-key'));