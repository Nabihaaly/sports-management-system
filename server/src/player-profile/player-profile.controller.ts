import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { PlayerProfileService } from './player-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MAX_IMAGE_BYTES } from '../storage/image.util';

@Controller('player-profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PLAYER)
export class PlayerProfileController {
  constructor(private readonly playerProfile: PlayerProfileService) {}

  // Search other players by display name
  @Get('search')
  searchPlayers(@Session() session: UserSession, @Query('name') name: string) {
    return this.playerProfile.searchPlayers(session.user.id, name);
  }

  // Get logged-in player's own profile
  @Get('/')
  getProfile(@Session() session: UserSession) {
    return this.playerProfile.getProfile(session.user.id);
  }

  // Create or update logged-in player's profile
  @Patch('/')
  updateProfile(@Session() session: UserSession, @Body() dto: UpdateProfileDto) {
    return this.playerProfile.updateProfile(session.user.id, dto);
  }

  // POST /player-profile/picture — multipart, field "file", JPG/PNG/WebP, max 5 MB
  @Post('picture')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  uploadPicture(
    @Session() session: UserSession,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.playerProfile.uploadPicture(session.user.id, file);
  }

  // DELETE /player-profile/picture
  @Delete('picture')
  removePicture(@Session() session: UserSession) {
    return this.playerProfile.removePicture(session.user.id);
  }

  // Get another player's public profile — ':id' sabse neeche, warna "search"/"picture" ko id samjhega
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.playerProfile.getPublicProfile(id);
  }
}