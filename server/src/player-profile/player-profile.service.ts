import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { assertImage, imagePath, IMAGE_BUCKET } from '../storage/image.util';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class PlayerProfileService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

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

  // Profile picture upload: validate → Supabase → URL save → purani file delete
  async uploadPicture(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded (field name: file)');
    }
    const { contentType, ext } = assertImage(file);

    const existing = await this.prisma.playerProfile.findUnique({
      where: { userId },
      select: { profilePicture: true },
    });

    const url = await this.storage.upload(
      IMAGE_BUCKET,
      imagePath(`profiles/${userId}`, ext),
      file.buffer,
      contentType,
    );

    // upsert: Skip wale user ki profile row abhi na ho to ban jaye
    const profile = await this.prisma.playerProfile.upsert({
      where: { userId },
      create: { userId, profilePicture: url },
      update: { profilePicture: url },
    });

    // Purani picture sirf tab delete jab wo humari bucket ki thi
    // (purane text-URL wale profiles ke liye pathFromUrl null dega → skip)
    const oldPath =
      existing?.profilePicture &&
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
}