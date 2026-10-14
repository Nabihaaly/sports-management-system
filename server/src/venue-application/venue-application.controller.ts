import { Controller, Post, UseGuards,Body } from '@nestjs/common';
import { VenueApplicationService } from './venue-application.service';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorators';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller('venue-application')
export class VenueApplicationController {
     constructor(
            private readonly venueApplication: VenueApplicationService,
          ) {}

          @Post("/")
          @UseGuards(AuthGuard,RolesGuard)
          @Roles(Role.OWNER)
          createApplication(@Body() dto: CreateApplicationDto){
            return this.venueApplication.createApplication(dto)
          }
}
