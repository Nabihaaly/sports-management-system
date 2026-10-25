import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { CourtService } from './court.service';
import { CreateCourtDto } from './dto/create-dto';

@Controller('court')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Get('venues')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findMyVenues(@Session() session: UserSession) {
    return this.courtService.findMyVenues(session.user.id);
  }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  create(@Session() session: UserSession, @Body() dto: CreateCourtDto) {
    return this.courtService.create(session.user.id, dto);
  }
}