
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
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';

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
    StorageModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthapiService],
})
export class AppModule {}
