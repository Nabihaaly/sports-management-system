import { Role } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class UpdateRoleDto {
  @IsNotEmpty()
  role!: Role;
}