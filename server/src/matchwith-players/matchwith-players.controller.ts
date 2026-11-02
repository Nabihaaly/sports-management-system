import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { Session } from '@thallesp/nestjs-better-auth';
import { MatchwithPlayersService } from './matchwith-players.service';

@Controller('matchwith-players')
export class MatchwithPlayersController {
  constructor(
    private readonly matchService: MatchwithPlayersService,
  ) {}

  @Post()
  createRequest(
    @Session() session: any,
    @Body()
    body: {
      preferredSport: string;
      availableFrom: string;
      availableUntil: string;
      budget: number;
    },
  ) {
    return this.matchService.createRequest(
      session.user.id,
      body,
    );
  }
}