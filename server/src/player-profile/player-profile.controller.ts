import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
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
    constructor(private readonly playerProfile: PlayerProfileService) { }

    
    @Get('/')
    getProfile(@Session() session: UserSession) {
        return this.playerProfile.getProfile(session.user.id);
    }

    @Patch('/') 
    updateProfile(@Session() session: UserSession, @Body() dto: UpdateProfileDto) {
        return this.playerProfile.updateProfile(session.user.id, dto);
    }
}
