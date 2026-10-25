import { SkillLevel } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profilePicture?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSports?: string[];
}