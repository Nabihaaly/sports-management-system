
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AuthGuard,
  Session,
} from '@thallesp/nestjs-better-auth';

import type { UserSession } from '@thallesp/nestjs-better-auth';

import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorators';
import { RolesGuard } from 'src/common/guards/role.guards';
import { playerDashboardService } from './playerDashboard.service';

@Controller('player')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PLAYER)
export class playerDashboardController {
  constructor(
    private readonly playerservice: playerDashboardService,
  ) {}

  @Get('venues')
  getVenues() {
    return this.playerservice.getVenues();
  }

  @Get('venues/:venueId')
  getVenue(@Param('venueId') venueId: string) {
    return this.playerservice.getVenue(venueId);
  }

  @Get('courts/:courtId')
  getCourt(@Param('courtId') courtId: string) {
    return this.playerservice.getCourt(courtId);
  }

  @Get('courts/:courtId/slots')
  getSlots(
    @Param('courtId') courtId: string,
    @Query('date') date: string,
  ) {
    return this.playerservice.getSlots(courtId, date);
  }

  // Existing single booking.
  @Post('bookings')
  createBooking(
    @Session() session: UserSession,
    @Body()
    body: {
      courtId: string;
      date: string;
      startTime: string;
    },
  ) {
    return this.playerservice.createBooking(
      session.user.id,
      body,
    );
  }

  // New split booking.
  @Post('bookings/split')
  createSplitBooking(
    @Session() session: UserSession,
    @Body()
    body: {
      courtId: string;
      date: string;
      startTime: string;
      invitedUserIds: string[];
    },
  ) {
    return this.playerservice.createSplitBooking(
      session.user.id,
      body,
    );
  }

  // Invitations received by the logged-in player.
  @Get('bookings/invitations')
  getSplitInvitations(
    @Session() session: UserSession,
  ) {
    return this.playerservice.getSplitInvitations(
      session.user.id,
    );
  }

  // Accept invitation.
  @Post('bookings/:id/accept-invitation')
  acceptSplitInvitation(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.acceptSplitInvitation(
      session.user.id,
      id,
    );
  }

  // Decline invitation.
  @Post('bookings/:id/decline-invitation')
  declineSplitInvitation(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.declineSplitInvitation(
      session.user.id,
      id,
    );
  }

  // Confirm an individual participant's payment.
  @Post('bookings/:id/pay')
  confirmSplitPayment(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.confirmSplitPayment(
      session.user.id,
      id,
    );
  }

  // Keep this before GET bookings/:id.
  @Get('bookings/held')
  getHeldBookings(
    @Session() session: UserSession,
  ) {
    return this.playerservice.getHeldBookings(
      session.user.id,
    );
  }

  @Get('bookings/:id')
  getBooking(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.getBooking(
      session.user.id,
      id,
    );
  }

  @Post('bookings/:id/confirm')
  confirmBooking(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.playerservice.confirmBooking(
      session.user.id,
      id,
    );
  }
}
