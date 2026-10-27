import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UserRole } from '../../users/entities/user-role.enum.js';
import { UsersService } from '../../users/services/users.service.js';
import { ROLES_KEY } from './roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: number };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    try {
      const currentUser = await this.usersService.findOne(user.sub);
      if (!requiredRoles.includes(currentUser.role)) {
        throw new ForbiddenException('You do not have permission to access this resource.');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    return true;
  }
}
