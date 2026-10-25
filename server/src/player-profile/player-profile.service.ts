import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class PlayerProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });
    // null = profile abhi tak nahi bana (Skip for now case)
    return { profile };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });

    const merged = { ...existing, ...dto };
    const isProfileComplete = Boolean(
      merged.displayName && merged.city && merged.skillLevel,
    );

    const profile = await this.prisma.playerProfile.upsert({
      where: { userId },
      create: { userId, ...dto, isProfileComplete },
      update: { ...dto, isProfileComplete },
    });

    return { profile };
  }
}