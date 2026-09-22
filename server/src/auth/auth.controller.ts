import { Controller, Req,Get, UseGuards, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { UpdateRoleDto } from './dto/auth.dto';
import { AuthapiService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authservice: AuthapiService,
      ) {}

    @Get("/")
    @UseGuards(AuthGuard)
    getUser(@Req() request:any){
        return request.user; 
    }

    @Patch("/setRole")
    @UseGuards(AuthGuard)
    updateRole(@Req() request: any,@Body() dto: UpdateRoleDto){
        const userid = request.user.id;
        console.log("hi")
        return this.authservice.updateRole(userid,dto)
    }

}
