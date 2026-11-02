
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { StorageService } from '../storage/storage.service';
import { assertImage, imagePath, IMAGE_BUCKET } from '../storage/image.util';

@Injectable()
export class PlayerProfileService {
  constructor(private prisma: PrismaService,
    private storage: StorageService) {}

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
    // Profile picture upload: validate → Supabase → URL save → purani file delete.
  // Profile row honi chahiye (displayName/city required hain) → pehle Save, phir photo.
  async uploadPicture(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded (field name: file)');
    }
    const { contentType, ext } = assertImage(file);

    const existing = await this.prisma.playerProfile.findUnique({
      where: { userId },
      select: { profilePicture: true },
    });
    if (!existing) {
      throw new BadRequestException(
        'Save your display name and city first, then add a photo.',
      );
    }

    const url = await this.storage.upload(
      IMAGE_BUCKET,
      imagePath(`profiles/${userId}`, ext),
      file.buffer,
      contentType,
    );

    const profile = await this.prisma.playerProfile.update({
      where: { userId },
      data: { profilePicture: url },
    });

    // Purani picture sirf tab delete jab wo humari bucket ki thi
    const oldPath =
      existing.profilePicture &&
      this.storage.pathFromUrl(IMAGE_BUCKET, existing.profilePicture);
    if (oldPath) await this.storage.remove(IMAGE_BUCKET, oldPath);

    return { profile };
  }

  async removePicture(userId: string) {
    const existing = await this.prisma.playerProfile.findUnique({
      where: { userId },
      select: { profilePicture: true },
    });
    if (!existing?.profilePicture) return this.getProfile(userId);

    const profile = await this.prisma.playerProfile.update({
      where: { userId },
      data: { profilePicture: null },
    });

    const oldPath = this.storage.pathFromUrl(IMAGE_BUCKET, existing.profilePicture);
    if (oldPath) await this.storage.remove(IMAGE_BUCKET, oldPath);

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