import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
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

  // Keep this below 'venues' so the static route is matched first
  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findOne(@Session() session: UserSession, @Param('id') id: string) {
    return this.courtService.findOne(session.user.id, id);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.courtService.update(session.user.id, id, dto);
  }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  create(@Session() session: UserSession, @Body() dto: CreateCourtDto) {
    return this.courtService.create(session.user.id, dto);
  }
}