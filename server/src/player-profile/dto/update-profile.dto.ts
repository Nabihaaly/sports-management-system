
import { SkillLevel } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
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

  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @IsOptional()
  @IsBoolean()
  availableForMatching?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSports?: string[];
}