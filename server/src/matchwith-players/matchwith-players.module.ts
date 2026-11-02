
import { Module } from '@nestjs/common';

import { MatchwithPlayersController } from './matchwith-players.controller';
import { MatchwithPlayersService } from './matchwith-players.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MatchwithPlayersController],
  providers: [MatchwithPlayersService],
  exports: [MatchwithPlayersService],
})
export class MatchwithPlayersModule {}
