import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VenueApplicationController } from './venue-application.controller';
import { VenueApplicationService } from './venue-application.service';

@Module({
  imports: [PrismaModule],
  controllers: [VenueApplicationController],
  providers: [VenueApplicationService],
})
export class VenueApplicationModule {}