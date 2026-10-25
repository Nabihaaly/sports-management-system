import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayerProfileController } from './player-profile.controller';
import { PlayerProfileService } from './player-profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlayerProfileController],
  providers: [PlayerProfileService],
})
export class PlayerProfileModule {}