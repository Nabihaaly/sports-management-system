import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// GET /player-matching/matches?courtId=...&requestId=...&limit=10
export class FindMatchesDto {
  // Kis request ke liye matches chahiye. Na do to player ki latest active request use hogi.
  @IsOptional()
  @IsString()
  requestId?: string;

  // "Book a court" page se aaye to court ka id: sport, city aur per-player price court se aayenge.
  @IsOptional()
  @IsString()
  courtId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
