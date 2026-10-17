
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class VenueApplicationService {
  constructor(private prisma: PrismaService) {}

  async createApplication(userId: string, dto: CreateApplicationDto) {
    const { venueOwner, venueDetails } = dto;

    try {
      // Save owner information
      const owner = await this.prisma.venueOwnerPersonal.create({
        data: {
    userId,
    fullName: venueOwner.fullName,
    cnic: venueOwner.cnic,
    phoneNumber: venueOwner.phoneNumber,
  },
});

      // Save venue information
      const venue = await this.prisma.venueApplicationDetails.create({
        data: {
          venueOwnerId: owner.id,
          venueName: venueDetails.venueName,
          description: venueDetails.description,
          address: venueDetails.address,
          city: venueDetails.city,
          images: venueDetails.images ?? [],
          businessRegistration: venueDetails.businessRegistration ?? '',
          sizeOfVenue: venueDetails.sizeOfVenue,
          courtsPriceRange: venueDetails.courtsPriceRange,
        },
      });

      return { owner, venue };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An owner with this CNIC is already registered',
        );
      }

      throw error;
    }
  }

  async getStatus(userId: string) {
    const owner = await this.prisma.venueOwnerPersonal.findUnique({
      where: { userId },
      select: { status: true },
    });
    return { status: owner?.status ?? null };
  }
}
