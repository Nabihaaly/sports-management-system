import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, WeekDay } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto } from './dto/create-dto';

@Injectable()
export class CourtService {
  constructor(private prisma: PrismaService) {}

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
}