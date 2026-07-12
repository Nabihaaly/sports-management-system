import { Controller, Post,Body, Get } from '@nestjs/common';
import { StudentTestService } from './student-test.service';
import { CreateStudentDto } from './dto/create-student-dto';

@Controller('student')
export class StudentTestController {
    constructor(
    private readonly stestservice: StudentTestService,
  ) {}

//    @Post()
//     create(@Body() dto: CreateStudentDto){
//         return this.stestservice.createstudent(dto)
//     }

   @Get()
   getall(){
    return "hello bro";
   }


}
