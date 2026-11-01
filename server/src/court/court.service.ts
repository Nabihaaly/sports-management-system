import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, WeekDay } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto } from './dto/create-dto';
import { StorageService } from '../storage/storage.service';

const MODEL_BUCKET = 'court-models';

@Injectable()
export class CourtService {

  constructor(private prisma: PrismaService, private storage: StorageService) {}

  // The owner's approved venues, each with its courts and availability
  async findMyVenues(userId: string) {
    const owner = await this.prisma.venueOwnerPersonal.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!owner) return [];

    return this.prisma.venueApplicationDetails.findMany({
      where: {
        venueOwnerId: owner.id,
        status: ApplicationStatus.APPROVED,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        courts: {
          orderBy: { createdAt: 'asc' },
          include: {
            availabilities: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateCourtDto) {
    const owner = await this.prisma.venueOwnerPersonal.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!owner) {
      throw new NotFoundException('Venue owner profile not found');
    }

    // The venue must belong to this owner and be approved
    const venue = await this.prisma.venueApplicationDetails.findFirst({
      where: {
        id: dto.venueId,
        venueOwnerId: owner.id,
        status: ApplicationStatus.APPROVED,
      },
      select: { id: true },
    });
    if (!venue) {
      throw new NotFoundException('Approved venue not found');
    }

    this.validate(dto);

    // The owner defines every slot themselves, so there is no auto-generated fallback.
    // Nested create saves the court and its schedule in one operation.
    return this.prisma.court.create({
      data: {
        venueId: venue.id,
        courtName: dto.courtName,
        sport: dto.sport,
        courtType: dto.courtType,
        maxPlayers: dto.maxPlayers,
        bookingDurationMinutes: dto.bookingDurationMinutes ?? 60,
        description: dto.description,
        pricePerSlotPKR: dto.pricePerSlotPKR,
        openingTime: dto.openingTime,
        closingTime: dto.closingTime,
        operatingDays: dto.operatingDays,
        isActive: dto.isActive ?? true,
        availabilities: {
          create: dto.availabilities!.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
          })),
        },
      },
      include: { availabilities: true },
    });
  }

  async update(userId: string, courtId: string, dto: CreateCourtDto) {
    const existing = await this.prisma.court.findFirst({
      where: { id: courtId, venue: { venueOwner: { userId } } },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Court not found');
    }

    this.validate(dto);

    // The venue never changes. The submitted schedule replaces the old one
    // (deleteMany + create run together in a single update).
    return this.prisma.court.update({
      where: { id: existing.id },
      data: {
        courtName: dto.courtName,
        sport: dto.sport,
        courtType: dto.courtType,
        maxPlayers: dto.maxPlayers,
        bookingDurationMinutes: dto.bookingDurationMinutes ?? 60,
        description: dto.description ?? null,
        pricePerSlotPKR: dto.pricePerSlotPKR,
        openingTime: dto.openingTime,
        closingTime: dto.closingTime,
        operatingDays: dto.operatingDays,
        isActive: dto.isActive ?? true,
        availabilities: {
          deleteMany: {},
          create: dto.availabilities!.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
          })),
        },
      },
      include: { availabilities: true },
    });
  }

  // A single court, only if it belongs to one of this owner's venues
  async findOne(userId: string, courtId: string) {
    const court = await this.prisma.court.findFirst({
      where: { id: courtId, venue: { venueOwner: { userId } } },
      include: {
        availabilities: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        venue: { select: { id: true, venueName: true, city: true } },
      },
    });
    if (!court) {
      throw new NotFoundException('Court not found');
    }
    return court;
  }

  // "HH:mm" strings compare correctly as plain strings
  private validate(dto: CreateCourtDto) {
    if (dto.closingTime <= dto.openingTime) {
      throw new BadRequestException(
        'Closing time must be after opening time',
      );
    }

    if (!dto.availabilities || dto.availabilities.length === 0) {
      throw new BadRequestException('A weekly schedule is required');
    }

    const byDay = new Map<WeekDay, { start: string; end: string }[]>();

    for (const w of dto.availabilities) {
      if (!dto.operatingDays.includes(w.dayOfWeek)) {
        throw new BadRequestException(
          `${w.dayOfWeek} is not one of the operating days`,
        );
      }
      if (w.endTime <= w.startTime) {
        throw new BadRequestException(
          'Slot end time must be after start time',
        );
      }
      if (w.startTime < dto.openingTime || w.endTime > dto.closingTime) {
        throw new BadRequestException(
          'Slots must fall within opening and closing time',
        );
      }
      const list = byDay.get(w.dayOfWeek) ?? [];
      list.push({ start: w.startTime, end: w.endTime });
      byDay.set(w.dayOfWeek, list);
    }

    // Every operating day needs its own schedule
    for (const day of dto.operatingDays) {
      if (!byDay.has(day)) {
        throw new BadRequestException(`No slots defined for ${day}`);
      }
    }

    for (const [day, slots] of byDay.entries()) {
      slots.sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].start < slots[i - 1].end) {
          throw new BadRequestException(`Slots overlap on ${day}`);
        }
      }
    }
  }
  
// Owner apne court ka 3D scan (.glb) upload karta hai
async uploadModel(userId: string, courtId: string, file?: Express.Multer.File) {
  if (!file) throw new BadRequestException('No file uploaded (field name: file)');

  // Extension + magic bytes dono check — sirf naam pe bharosa nahi.
  // Har valid .glb file "glTF" ascii se shuru hoti hai.
  const isGlbName = file.originalname.toLowerCase().endsWith('.glb');
  const isGlbMagic = file.buffer.subarray(0, 4).toString('ascii') === 'glTF';
  if (!isGlbName || !isGlbMagic) {
    throw new BadRequestException('Only .glb (binary glTF) files are allowed');
  }

  const court = await this.prisma.court.findFirst({
    where: { id: courtId, venue: { venueOwner: { userId } } }, // ownership
    select: { id: true, model3dUrl: true },
  });
  if (!court) throw new NotFoundException('Court not found');

  // Path: courts/<courtId>/<timestamp>.glb — timestamp se browser cache bhi bust hota hai
  const path = `courts/${court.id}/${Date.now()}.glb`;
  const url = await this.storage.upload(MODEL_BUCKET, path, file.buffer, 'model/gltf-binary');

  const updated = await this.prisma.court.update({
    where: { id: court.id },
    data: { model3dUrl: url },
    select: { id: true, model3dUrl: true },
  });

  // Purani file saaf karo (storage quota bachao) — DB update ke BAAD, taake fail ho to bhi naya URL save ho
  if (court.model3dUrl) {
    const oldPath = this.storage.pathFromUrl(MODEL_BUCKET, court.model3dUrl);
    if (oldPath) await this.storage.remove(MODEL_BUCKET, oldPath);
  }

  return updated;
}

// Scan hatao → court wapas default template pe
async removeModel(userId: string, courtId: string) {
  const court = await this.prisma.court.findFirst({
    where: { id: courtId, venue: { venueOwner: { userId } } },
    select: { id: true, model3dUrl: true },
  });
  if (!court) throw new NotFoundException('Court not found');
  if (!court.model3dUrl) return { id: court.id, model3dUrl: null };

  const updated = await this.prisma.court.update({
    where: { id: court.id },
    data: { model3dUrl: null },
    select: { id: true, model3dUrl: true },
  });

  const oldPath = this.storage.pathFromUrl(MODEL_BUCKET, court.model3dUrl);
  if (oldPath) await this.storage.remove(MODEL_BUCKET, oldPath);

  return updated;
}
}