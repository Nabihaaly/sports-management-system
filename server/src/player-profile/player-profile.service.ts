
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class PlayerProfileService {
  constructor(private prisma: PrismaService) {}

  // Get logged-in player's profile
  async getProfile(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });

    // null means profile has not been created yet
    return { profile };
  }

  // Search other players by display name
  async searchPlayers(userId: string, name: string) {
    const searchName = name?.trim();

    if (!searchName) {
      return { players: [] };
    }

    const players = await this.prisma.playerProfile.findMany({
      where: {
        userId: {
          not: userId,
        },

        displayName: {
          contains: searchName,
          mode: 'insensitive',
        },
      },

      select: {
        id: true,
        displayName: true,
        city: true,
        profilePicture: true,
        skillLevel: true,
        preferredSports: true,
        availableForMatching: true,
      },

      take: 20,
      orderBy: {
        displayName: 'asc',
      },
    });

    return { players };
  }

  // Create or update player profile
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

  // Get another player's public profile
async getPublicProfile(profileId: string) {
  const profile = await this.prisma.playerProfile.findUnique({
    where: {
      id: profileId,
    },
    select: {
      id: true,
      displayName: true,
      city: true,
      bio: true,
      profilePicture: true,
      skillLevel: true,
      preferredSports: true,
      availableForMatching: true,
    },
  });

  if (!profile) {
    throw new NotFoundException('Player profile not found');
  }

  return { profile };
}
}
