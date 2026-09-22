import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);




//SetMetadata is a NestJS function that lets you attach extra information (metadata) to a controller or route.
// For example, imagine you write:
// @Roles(Role.ADMIN)
// @Get('admin')
// getAdminData() {
//   return 'Admin data';
// }
// NestJS needs some way to remember:
// "This route requires the ADMIN role."
// That's what SetMetadata() does.

// export const ROLES_KEY = 'roles';
// This is simply a key/name under which we're going to store the role information.
// Think of it like:
// Key       Value
// ------------------------
// "roles"   [ADMIN]