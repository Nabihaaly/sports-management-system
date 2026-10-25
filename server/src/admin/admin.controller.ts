import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { AdminService } from './admin.service';
import { ListApplicationsQueryDto, ReviewApplicationDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // GET /admin/venue-applications?status=PENDING
  @Get('venue-applications')
  listApplications(@Query() query: ListApplicationsQueryDto) {
    return this.admin.listApplications(query.status);
  }

  // PATCH /admin/venue-applications/:id/review  { status, adminNote? }
  @Patch('venue-applications/:id/review')
  reviewApplication(@Param('id') id: string, @Body() dto: ReviewApplicationDto) {
    return this.admin.reviewApplication(id, dto);
  }
}