import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorators';
import { RolesGuard } from 'src/common/guards/role.guards';
import { playerDashboardService } from './playerDashboard.service';

@Controller('player')
export class playerDashboardController {
  constructor(private readonly playerservice: playerDashboardService) {}

  // GET /player/venues
  @Get('venues')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  getVenues() {
    return this.playerservice.getVenues();
  }

  // GET /player/venues/:venueId
  @Get('venues/:venueId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  getVenue(@Param('venueId') venueId: string) {
    return this.playerservice.getVenue(venueId);
  }

  // GET /player/courts/:courtId   (NEW: full details of one court)
  @Get('courts/:courtId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  getCourt(@Param('courtId') courtId: string) {
    return this.playerservice.getCourt(courtId);
  }

  // GET /player/courts/:courtId/slots?date=2026-11-02
  @Get('courts/:courtId/slots')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  getSlots(
    @Param('courtId') courtId: string,
    @Query('date') date: string,
  ) {
    return this.playerservice.getSlots(courtId, date);
  }

  // POST /player/bookings
  @Post('bookings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  createBooking(
    @Session() session: UserSession,
    @Body() body: { courtId: string; date: string; startTime: string },
  ) {
    return this.playerservice.createBooking(session.user.id, body);
  }

    // GET /player/bookings/held
@Get('bookings/held')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PLAYER)
getHeldBookings(@Session() session: UserSession) {
  return this.playerservice.getHeldBookings(session.user.id);
}

  // GET /player/bookings/:id
  @Get('bookings/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  getBooking(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.getBooking(session.user.id, id);
  }



  // POST /player/bookings/:id/confirm
  @Post('bookings/:id/confirm')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
  confirmBooking(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.confirmBooking(
      session.user.id,
      id
    );
  }


  
}