import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AuthGuard,
  Session,
} from '@thallesp/nestjs-better-auth';

import type { UserSession } from '@thallesp/nestjs-better-auth';

import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';

import { PlayerProfileService } from './player-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('player-profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PLAYER)
export class PlayerProfileController {
  constructor(
    private readonly playerProfile: PlayerProfileService,
  ) {}

  // Search other players by display name
  @Get('search')
  searchPlayers(
    @Session() session: UserSession,
    @Query('name') name: string,
  ) {
    return this.playerProfile.searchPlayers(
      session.user.id,
      name,
    );
  }

  // Get logged-in player's own profile
  @Get('/')
  getProfile(@Session() session: UserSession) {
    return this.playerProfile.getProfile(session.user.id);
  }

  // Create or update logged-in player's profile
  @Patch('/')
  updateProfile(
    @Session() session: UserSession,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.playerProfile.updateProfile(
      session.user.id,
      dto,
    );
  }

  @Get(':id')
getPublicProfile(@Param('id') id: string) {
  return this.playerProfile.getPublicProfile(id);
}
}
