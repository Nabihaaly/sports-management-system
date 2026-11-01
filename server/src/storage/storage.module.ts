import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Global() // PrismaModule ki tarah — har module ko chahiye hoga, baar baar import nahi
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}