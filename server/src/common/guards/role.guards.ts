import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { ROLES_KEY } from 'src/common/decorators/role.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the roles required by the endpoint
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    // 2. If endpoint has no @Roles(), allow it
    if (!requiredRoles) {
      return true;
    }

    // 3. Get the current request
    const request = context.switchToHttp().getRequest();

    // 4. Better Auth puts the authenticated user on request
    const user = request.user;

    // 5. Make sure user exists
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 6. Get user's role
    const userRole = user.role;

    // 7. Check whether user's role is allowed
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    // 8. User has the required role
    return true;
  }
}