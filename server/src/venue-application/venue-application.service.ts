import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class VenueApplicationService {
    constructor(
        private prisma: PrismaService,
      ) {}
    
      async createApplication(dto: CreateApplicationDto){

      }
}
