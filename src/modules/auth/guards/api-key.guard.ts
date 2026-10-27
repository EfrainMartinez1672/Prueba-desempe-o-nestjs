import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-api-key'];
    const expected = this.config.get<string>('API_KEY');

    if (!expected || typeof provided !== 'string') {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}