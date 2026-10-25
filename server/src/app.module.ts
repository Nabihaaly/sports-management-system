import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentTestModule } from './student-test/student-test.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { AuthController } from './auth/auth.controller';
import { AuthapiService } from './auth/auth.service';
import { AuthApiModule } from './auth/auth.module';
import { VenueApplicationModule } from './venue-application/venue-application.module';
import { CourtModule } from './court/court.module';


@Module({
  imports: [PrismaModule, StudentTestModule,AuthModule.forRoot({ auth }), AuthApiModule, VenueApplicationModule, CourtModule],
  controllers: [AppController, AuthController, VenueApplicationController],
  providers: [AppService, AuthapiService, VenueApplicationService],
import { PlayerProfileModule } from './player-profile/player-profile.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    StudentTestModule,
    AuthModule.forRoot({ auth }),
    AuthApiModule,
    VenueApplicationModule,
    PlayerProfileModule,
    AdminModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthapiService],
})
export class AppModule {}
