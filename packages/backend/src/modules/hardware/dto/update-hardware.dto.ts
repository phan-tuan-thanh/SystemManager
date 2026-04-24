import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHardwareDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serial?: string;

  @ApiPropertyOptional({ description: 'JSON specs (cores, speed, capacity, etc.)' })
  @IsOptional()
  specs?: Record<string, any>;
}
