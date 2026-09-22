import { StudentTestService } from './student-test.service';
import { AuthGuard} from '@thallesp/nestjs-better-auth';
import { Roles } from 'src/common/decorators/role.decorators';
import { RolesGuard } from 'src/common/guards/role.guards';
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';

@Controller('student')
export class StudentTestController {
    constructor(
    private readonly stestservice: StudentTestService,
  ) {}

  @Get('/')
  @UseGuards(RolesGuard,AuthGuard)
  @Roles(Role.PLAYER)
  getData() {
    return this.stestservice.getData();
  }


}
