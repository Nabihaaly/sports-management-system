import { Module } from '@nestjs/common';
import { playerDashboardController } from './playerDashboard.controller';
import { playerDashboardService } from './playerDashboard.service';

@Module({
  controllers: [playerDashboardController],
  providers: [playerDashboardService]
})
export class playerDashboardModule {}
