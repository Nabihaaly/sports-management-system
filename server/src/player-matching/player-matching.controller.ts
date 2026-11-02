import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorators';
import { RolesGuard } from 'src/common/guards/role.guards';
import { PlayerMatchingService } from './player-matching.service';
import { FindMatchesDto } from './dto/find-matches.dto';

@Controller('player-matching')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.PLAYER)
export class PlayerMatchingController {
  constructor(private readonly matching: PlayerMatchingService) {}

  // GET /player-matching/matches                 -> meri latest request ke best matches
  // GET /player-matching/matches?courtId=abc     -> "Book a court" page ka "Match with players"
  @Get('matches')
  findMatches(@Session() session: UserSession, @Query() q: FindMatchesDto) {
    return this.matching.findMatches(session.user.id, q);
  }
}
