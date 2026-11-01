
import {
  Controller,
  Post,
  Param,
  Req,
  UseGuards,
  Get,
  Patch,
  Delete
} from '@nestjs/common';

import { FriendService } from './friend.service';

// Use the same AuthGuard import path as your existing
// player-profile.controller.ts.
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorators';
import { RolesGuard } from 'src/common/guards/role.guards';

@Controller('friends')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PLAYER)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request/:profileId')
  sendFriendRequest(
    @Req() request: any,
    @Param('profileId') profileId: string,
  ) {
    const senderId = request.user.id;

    return this.friendService.sendFriendRequest(senderId, profileId);
  }

  // Get all incoming pending requests
  @Get('requests/received')
  getReceivedRequests(@Req() request: any) {
    const userId = request.user.id;

    return this.friendService.getReceivedRequests(userId);
  }

  // Accept a friend request
  @Patch(':id/accept')
  acceptFriendRequest(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    const userId = request.user.id;

    return this.friendService.acceptFriendRequest(userId, id);
  }

  // Decline a friend request
  @Delete(':id/reject')
  declineFriendRequest(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    const userId = request.user.id;

    return this.friendService.declineFriendRequest(userId, id);
  }
}
