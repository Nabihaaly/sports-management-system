import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class VenueApplicationService {
  constructor(private prisma: PrismaService) { }

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

  // Owner ki state:
  //   isVerified = uska koi ek venue APPROVED hai (owner-level approval derive hoti hai)
  //   status     = sabse naye venue application ka status (null = abhi koi application nahi)
  async getStatus(userId: string) {
    const owner = await this.prisma.venueOwnerPersonal.findUnique({
      where: { userId },
      select: {
        venues: {
          select: {
            id: true,
            venueName: true,
            status: true,
          },
        },
      },
    });

    return {
      status: owner?.venues[0]?.status ?? null,
    };
  }

  // Activate / deactivate an approved venue together with all of its courts.
  // Both updates run in one transaction so they never get out of sync.
  async setVenueActive(userId: string, venueId: string, isActive: boolean) {
    const venue = await this.prisma.venueApplicationDetails.findFirst({
      where: {
        id: venueId,
        venueOwner: { userId },
        status: ApplicationStatus.APPROVED,
      },
      select: { id: true },
    });
    if (!venue) {
      throw new NotFoundException('Approved venue not found');
    }

    const [updatedVenue] = await this.prisma.$transaction([
      this.prisma.venueApplicationDetails.update({
        where: { id: venue.id },
        data: { isActive },
        select: { id: true, isActive: true },
      }),
      this.prisma.court.updateMany({
        where: { venueId: venue.id },
        data: { isActive },
      }),
    ]);

    return updatedVenue;
  }
}