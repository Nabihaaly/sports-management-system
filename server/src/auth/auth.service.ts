import { Injectable } from '@nestjs/common';
import { UpdateRoleDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthapiService {
  constructor(private prisma: PrismaService) {}

  async updateRole(userid: string,dto: UpdateRoleDto) {
    return this.prisma.user.update({
      where: {
        id: userid,
      },
      data: {
        role: dto.role,
      },
    });
  }
}
