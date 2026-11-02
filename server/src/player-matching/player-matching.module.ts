import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayerMatchingController } from './player-matching.controller';
import { PlayerMatchingService } from './player-matching.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlayerMatchingController],
  providers: [PlayerMatchingService],
})
export class PlayerMatchingModule {}
