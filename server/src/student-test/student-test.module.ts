import { Module } from '@nestjs/common';
import { StudentTestController } from './student-test.controller';
import { StudentTestService } from './student-test.service';

@Module({
  controllers: [StudentTestController],
  providers: [StudentTestService]
})
export class StudentTestModule {}
