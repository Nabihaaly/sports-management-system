import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { CourtService } from './court.service';
import { CreateCourtDto } from './dto/create-dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UpdateCourtImagesDto } from './dto/update-images.dto';
import { BookingStatus } from '@prisma/client';
import { MAX_IMAGE_BYTES } from '../storage/image.util';

@Controller('court')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Get('venues')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findMyVenues(@Session() session: UserSession) {
    return this.courtService.findMyVenues(session.user.id);
  }

  // GET /court/bookings?venueId=&date=YYYY-MM-DD&status=PENDING|CONFIRMED|CANCELLED
  // Owner ke saare venues ki bookings (read-only). Static route — ':id' se pehle rakhna zaroori hai.
  @Get('bookings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findBookings(
    @Session() session: UserSession,
    @Query('venueId') venueId?: string,
    @Query('date') date?: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.courtService.findBookings(session.user.id, { venueId, date, status });
  }

  // Keep this below 'venues' so the static route is matched first
  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  findOne(@Session() session: UserSession, @Param('id') id: string) {
    return this.courtService.findOne(session.user.id, id);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.courtService.update(session.user.id, id, dto);
  }

  // POST /court/:id/model  — multipart form, field name "file", .glb only, max 50 MB
  @Post(':id/model')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  uploadModel(
    @Session() session: UserSession,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.courtService.uploadModel(session.user.id, id, file);
  }

  // DELETE /court/:id/model — wapas default template pe
  @Delete(':id/model')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  removeModel(@Session() session: UserSession, @Param('id') id: string) {
    return this.courtService.removeModel(session.user.id, id);
  }

  // POST /court/:id/images — multipart, field "files" (max 6 x 5 MB) → { urls }
  // Sirf upload karta hai; list PATCH se save hoti hai (venue photos jaisa pattern)
  @Post(':id/images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @UseInterceptors(
    FilesInterceptor('files', 6, { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  uploadImages(
    @Session() session: UserSession,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.courtService.uploadImages(session.user.id, id, files);
  }

  // PATCH /court/:id/images — final list (add / remove / reorder)
  @Patch(':id/images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  setImages(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateCourtImagesDto,
  ) {
    return this.courtService.setImages(session.user.id, id, dto.images);
  }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  create(@Session() session: UserSession, @Body() dto: CreateCourtDto) {
    return this.courtService.create(session.user.id, dto);
  }
}