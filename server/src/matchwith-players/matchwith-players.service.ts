import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchwithPlayersService {
  constructor(private prisma: PrismaService) {}

  async createRequest(
    userId: string,
    body: {
      preferredSport: string;
      availableFrom: string;
      availableUntil: string;
      budget: number;
    },
  ) {
    const {
      preferredSport,
      availableFrom,
      availableUntil,
      budget,
    } = body;

    // Validate required fields
    if (
      !preferredSport?.trim() ||
      !availableFrom ||
      !availableUntil ||
      budget === undefined ||
      budget === null
    ) {
      throw new BadRequestException(
        'Please provide all required fields.',
      );
    }

    // Convert dates
    const fromDate = new Date(availableFrom);
    const untilDate = new Date(availableUntil);

    // Validate dates
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(untilDate.getTime())
    ) {
      throw new BadRequestException(
        'Invalid availability date or time.',
      );
    }

    // Validate availability range
    if (untilDate <= fromDate) {
      throw new BadRequestException(
        'Available until must be later than available from.',
      );
    }

    // Validate budget
    if (
      !Number.isInteger(Number(budget)) ||
      Number(budget) < 0
    ) {
      throw new BadRequestException(
        'Budget must be a non-negative whole number.',
      );
    }

    // Save request
    const request = await this.prisma.matchWithPlayers.create({
      data: {
        userId,
        preferredSport: preferredSport.trim(),
        availableFrom: fromDate,
        availableUntil: untilDate,
        budget: Number(budget),
      },
    });

    return {
      message: 'Request to play created successfully.',
      request,
    };
  }
}