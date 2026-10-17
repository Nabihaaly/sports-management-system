import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class VenueOwnerDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  // Pakistani CNIC: 13 digits, with or without dashes (12345-1234567-1)
  @Matches(/^\d{5}-?\d{7}-?\d$/, { message: 'Invalid CNIC format' })
  cnic!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}

export class VenueDetailsDto {
  @IsString()
  @IsNotEmpty()
  venueName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  businessRegistration?: string;

  @IsString()
  @IsNotEmpty()
  sizeOfVenue!: string;

  @IsString()
  @IsNotEmpty()
  courtsPriceRange!: string;
}

export class CreateApplicationDto {
  @ValidateNested()
  @Type(() => VenueOwnerDto)
  venueOwner!: VenueOwnerDto;

  @ValidateNested()
  @Type(() => VenueDetailsDto)
  venueDetails!: VenueDetailsDto;
}