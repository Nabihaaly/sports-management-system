import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { VenueApplicationService } from './venue-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller('venue-application')
export class VenueApplicationController {
  constructor(private readonly venueApplication: VenueApplicationService) {}

  @Get('status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  getStatus(@Session() session: UserSession) {
    return this.venueApplication.getStatus(session.user.id);
  }

  @Patch(':id/active')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  setVenueActive(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive must be true or false');
    }
    return this.venueApplication.setVenueActive(session.user.id, id, isActive);
  }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  createApplication(
    @Session() session: UserSession,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.venueApplication.createApplication(session.user.id, dto);
  }
}