import { ArrayMaxSize, IsArray, IsUrl } from 'class-validator';

export class UpdateCourtImagesDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images!: string[];
}
