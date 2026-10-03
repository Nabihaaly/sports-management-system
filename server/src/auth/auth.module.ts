import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthapiService } from './auth.service';

@Module({
    controllers:[AuthController],
    providers: [AuthapiService]
})
export class AuthApiModule {}
