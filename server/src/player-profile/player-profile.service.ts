import { BadRequestException, Injectable } from '@nestjs/common';
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

  // Get required fields from new data or existing profile
  const displayName = dto.displayName ?? existing?.displayName;
  const city = dto.city ?? existing?.city;

  // Require display name and city
  if (!displayName?.trim() || !city?.trim()) {
    throw new BadRequestException(
      'Display name and home city are required.',
    );
  }

  const isProfileComplete = Boolean(
    displayName.trim() && city.trim(),
  );

  const profile = await this.prisma.playerProfile.upsert({
    where: { userId },

    create: {
      userId,
      displayName: displayName.trim(),
      city: city.trim(),
      bio: dto.bio,
      profilePicture: dto.profilePicture,
      skillLevel: dto.skillLevel,
      availableForMatching: dto.availableForMatching ?? false,
      preferredSports: dto.preferredSports ?? [],
      isProfileComplete,
    },

    update: {
      ...dto,
      displayName: displayName.trim(),
      city: city.trim(),
      isProfileComplete,
    },
  });

  return { profile };
}
}