import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // async create(createUserDto: CreateUserDto): Promise<User> {
  //   const existing = await this.prisma.user.findUnique({
  //     where: { email: createUserDto.email },
  //   });

  //   if (existing) {
  //     throw new ConflictException(
  //       `User with email ${createUserDto.email} already exists`,
  //     );
  //   }

  //   try {
  //     return await this.prisma.user.create({
  //       data: createUserDto,
  //     });
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to create user');
  //   }
  // }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  // async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
  //   // Reuse findOne — throws 404 automatically if not found
  //   await this.findOne(id);

  //   // Check email conflict if email is being updated
  //   if (updateUserDto.email) {
  //     const emailTaken = await this.prisma.user.findFirst({
  //       where: { email: updateUserDto.email, NOT: { id } },
  //     });

  //     if (emailTaken) {
  //       throw new ConflictException(
  //         `Email ${updateUserDto.email} is already in use`,
  //       );
  //     }
  //   }

  //   try {
  //     return await this.prisma.user.update({
  //       where: { id },
  //       data: updateUserDto,
  //     });
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to update user');
  //   }
  // }

  async remove(id: number): Promise<{ message: string }> {
    // Reuse findOne — throws 404 automatically if not found
    await this.findOne(id);

    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: `User #${id} deleted successfully` };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
