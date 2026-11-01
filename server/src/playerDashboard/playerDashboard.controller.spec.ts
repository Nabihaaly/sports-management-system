import { playerDashboardService } from './playerDashboard.service';
import { AuthGuard, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from 'src/common/decorators/role.decorators';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

@Controller('player')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PLAYER)
export class playerDashboardController {
  constructor(private readonly playerservice: playerDashboardService) {}

  @Get('/')
  getData() {
    return this.playerservice.getData();
  }

  // GET /player/venues?city=Karachi
  @Get('venues')
  getVenues(@Session() session: UserSession, @Query('city') city?: string) {
    return this.playerservice.getVenues(session.user.id, city);
  }

  // GET /player/venues/:venueId
  @Get('venues/:venueId')
  getVenue(@Param('venueId') venueId: string) {
    return this.playerservice.getVenue(venueId);
  }

  // GET /player/courts/:courtId/slots?date=2026-11-02
  @Get('courts/:courtId/slots')
  getSlots(@Param('courtId') courtId: string, @Query('date') date: string) {
    return this.playerservice.getSlots(courtId, date);
  }

  // POST /player/bookings   body: { courtId, date, startTime }
  @Post('bookings')
  createBooking(
    @Session() session: UserSession,
    @Body() body: { courtId: string; date: string; startTime: string },
  ) {
    return this.playerservice.createBooking(session.user.id, body);
  }

  // GET /player/bookings/:id
  @Get('bookings/:id')
  getBooking(@Session() session: UserSession, @Param('id') id: string) {
    return this.playerservice.getBooking(session.user.id, id);
  }

  // POST /player/bookings/:id/confirm   body: { paymentMethod }
  @Post('bookings/:id/confirm')
  confirmBooking(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() body: { paymentMethod: string },
  ) {
    return this.playerservice.confirmBooking(session.user.id, id, body.paymentMethod);
  }
}