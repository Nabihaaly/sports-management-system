import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListApplicationsQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

export class ReviewApplicationDto {
  @IsIn([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
  status!: ApplicationStatus;
}