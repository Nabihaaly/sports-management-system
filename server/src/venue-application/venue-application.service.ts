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
  constructor(private prisma: PrismaService) {}

  // Owner ki pehli application: owner ki personal details + pehla venue, ek saath.
  // Venue PENDING status se banta hai (schema default); admin baad mein review karta hai.
  async createApplication(userId: string, dto: CreateApplicationDto) {
    const { venueOwner, venueDetails } = dto;

    try {
      // NOTE: do alag create hain, transaction nahi — agar venue create fail ho
      // to owner row ban chuki hogi. Behtar: $transaction (jaise setVenueActive mein).
      const owner = await this.prisma.venueOwnerPersonal.create({
        data: {
          userId,
          fullName: venueOwner.fullName,
          cnic: venueOwner.cnic,
          phoneNumber: venueOwner.phoneNumber,
        },
      });

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
      // P2002 = Prisma unique constraint violation.
      // Yahan do unique fields hain: userId (ek user = ek owner profile) aur cnic.
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

  // Owner ka "effective status" — frontend (redirect, applicationStatus page, Navbar)
  // sirf is ek field pe chalta hai:
  //
  //   null      → owner ne abhi koi application nahi bhari     → /venueApplication
  //   APPROVED  → owner ka KOI EK venue approved hai            → /venueDashboard
  //   PENDING / REJECTED → sabse naye venue ka status          → /applicationStatus
  //
  // "koi ek approved" ka rule isliye: verified owner naya venue add kare jo PENDING ho,
  // to wo dashboard se bahar na ho jaye. Owner-level verification yahin se derive hoti hai,
  // DB mein alag column nahi.
  async getStatus(userId: string) {
    const owner = await this.prisma.venueOwnerPersonal.findUnique({
      where: { userId },
      select: {
        venues: {
          orderBy: { createdAt: 'desc' }, // [0] = sabse naya venue
          select: { status: true },
        },
      },
    });

    if (!owner || owner.venues.length === 0) {
      return { status: null };
    }

    const anyApproved = owner.venues.some(
      (v) => v.status === ApplicationStatus.APPROVED,
    );

    return {
      status: anyApproved ? ApplicationStatus.APPROVED : owner.venues[0].status,
    };
  }

  // Venue activate / deactivate (SRS FR-14: deactivate without deleting history).
  // Sirf owner ka apna, APPROVED venue — isliye where mein teeno conditions.
  // Venue aur uske saare courts ek transaction mein update hote hain,
  // taake venue inactive aur court active jaisi state kabhi na bane.
  async setVenueActive(userId: string, venueId: string, isActive: boolean) {
    const venue = await this.prisma.venueApplicationDetails.findFirst({
      where: {
        id: venueId,
        venueOwner: { userId },             // ownership check (relation filter)
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