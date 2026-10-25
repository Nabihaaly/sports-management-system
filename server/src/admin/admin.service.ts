import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewApplicationDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Venue applications list, owner + user info ke saath
  async listApplications(status?: ApplicationStatus) {
    const applications = await this.prisma.venueApplicationDetails.findMany({
      where: status ? { status } : undefined,
      include: {
        venueOwner: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { applications };
  }

  // Admin approve / reject karta hai (sirf status badalta hai)
  async reviewApplication(id: string, dto: ReviewApplicationDto) {
    const venue = await this.prisma.venueApplicationDetails.findUnique({
      where: { id },
    });
    if (!venue) throw new NotFoundException('Application not found');

    // if (venue.status === ApplicationStatus.APPROVED) {
    //   throw new BadRequestException('Application is already approved');
    // }
    if (venue.status === dto.status) {
      throw new BadRequestException(`Application is already ${dto.status.toLowerCase()}`);
    }

    const application = await this.prisma.venueApplicationDetails.update({
      where: { id },
      data: { status: dto.status },
    });

    return { application };
  }
}