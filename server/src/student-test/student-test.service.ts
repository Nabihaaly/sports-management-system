import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student-dto';

@Injectable()
export class StudentTestService {
    constructor(
    private prisma: PrismaService,
  ) {}

  async getData(){
    return { message: "hi" };
  }

  // async createstudent(dto: CreateStudentDto){
  //    return this.prisma.student.create({
  //     data: dto,
  //   });
  // }

  // async findAll() {
  //   return this.prisma.student.findMany();
  // }

  // async findOne(id: number) {
  //   return this.prisma.student.findUnique({
  //     where: { id },
  //   });
  // }

  //  async update(id: number, name: string) {
  //   return this.prisma.student.update({
  //     where: { id },
  //     data: {name},
  //   });
  // }

  // async delete(id: number) {
  //   return this.prisma.student.delete({
  //     where: { id },
  //   });
  // }
}
