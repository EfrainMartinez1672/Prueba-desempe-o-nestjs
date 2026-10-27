import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check whether the API is available.' })
  @ApiOkResponse({
    description: 'The API is available.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['status', 'timestamp'],
    },
  })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
