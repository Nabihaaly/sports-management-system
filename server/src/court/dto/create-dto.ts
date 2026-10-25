import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CourtType, WeekDay } from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CourtAvailabilityDto {
  @IsEnum(WeekDay)
  dayOfWeek: WeekDay;

  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
  endTime!: string;
}

export class CreateCourtDto {
  @IsString()
  @IsNotEmpty()
  venueId!: string;

  @IsString()
  @IsNotEmpty()
  courtName!: string;

  @IsString()
  @IsNotEmpty()
  sport!: string;

  @IsEnum(CourtType)
  courtType: CourtType;

  @IsInt()
  @Min(1)
  maxPlayers!: number;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  bookingDurationMinutes?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  pricePerSlotPKR!: number;

  @Matches(TIME_REGEX, { message: 'openingTime must be HH:mm' })
  openingTime!: string;

  @Matches(TIME_REGEX, { message: 'closingTime must be HH:mm' })
  closingTime!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(WeekDay, { each: true })
  operatingDays!: WeekDay[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Optional custom windows. If omitted, one window per operating day
  // (opening to closing time) is created automatically.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourtAvailabilityDto)
  availabilities?: CourtAvailabilityDto[];
}