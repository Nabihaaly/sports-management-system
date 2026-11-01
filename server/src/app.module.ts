
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { playerDashboardModule } from './playerDashboard/playerDashboard.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { AuthController } from './auth/auth.controller';
import { AuthapiService } from './auth/auth.service';
import { AuthApiModule } from './auth/auth.module';
import { VenueApplicationModule } from './venue-application/venue-application.module';
import { CourtModule } from './court/court.module';
import { PlayerProfileModule } from './player-profile/player-profile.module';
import { AdminModule } from './admin/admin.module';
import { FriendService } from './friend/friend.service';
import { FriendController } from './friend/friend.controller';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [
    PrismaModule,
    playerDashboardModule,
    AuthModule.forRoot({ auth }),
    AuthApiModule,
    VenueApplicationModule,
    CourtModule,
    PlayerProfileModule,
    AdminModule,
    FriendModule,
  ],
  controllers: [AppController, AuthController, FriendController],
  providers: [AppService, AuthapiService, FriendService],
})
export class AppModule {}
