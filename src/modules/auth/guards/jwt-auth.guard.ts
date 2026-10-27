import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '../../users/entities/user-role.enum.js';
import { AuthService } from '../services/auth.service.js';

interface AuthenticatedRequest extends Request {
  accessToken?: string;
  user?: {
    sub: number;
    email: string;
    sid: string;
    tokenUse: 'access';
    role: UserRole;
    exp: number;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.accessToken;
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('A valid accessToken cookie is required.');
    }
    const payload = await this.authService.verifyAccessToken(token);
    if (
      (await this.authService.isAccessTokenRevoked(token)) ||
      !(await this.authService.hasActiveSession(payload.sid))
    ) {
      throw new UnauthorizedException('The session was revoked.');
    }

    request.accessToken = token;
    request.user = payload;
    return true;
  }
}
