import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { VenueApplicationService } from './venue-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';

import { Delete, UploadedFiles, UseInterceptors } from '@nestjs/common'; // existing import mein merge karo
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateVenueImagesDto } from './dto/update-images.dto';
import { MAX_IMAGE_BYTES } from '../storage/image.util';

@Controller('venue-application')
export class VenueApplicationController {
  constructor(private readonly venueApplication: VenueApplicationService) {}

  @Get('status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  getStatus(@Session() session: UserSession) {
    return this.venueApplication.getStatus(session.user.id);
  }

    // POST /venue-application/images — form se PEHLE upload, URLs wapas (max 6 x 5 MB)
  // Venue abhi DB mein nahi hota, isliye folder owner ke userId pe
  @Post('images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @UseInterceptors(FilesInterceptor('files', 6, { limits: { fileSize: MAX_IMAGE_BYTES } }))
  uploadImages(
    @Session() session: UserSession,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.venueApplication.uploadImages(session.user.id, files);
  }

  // PATCH /venue-application/:id/images — final list set (add / remove / reorder)
  @Patch(':id/images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  setImages(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateVenueImagesDto,
  ) {
    return this.venueApplication.setImages(session.user.id, id, dto.images);
  }

  @Patch(':id/active')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  setVenueActive(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive must be true or false');
    }
    return this.venueApplication.setVenueActive(session.user.id, id, isActive);
  }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  createApplication(
    @Session() session: UserSession,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.venueApplication.createApplication(session.user.id, dto);
  }
}