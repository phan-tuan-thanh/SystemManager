import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class CreateSnapshotDto {
  @ApiPropertyOptional({ description: 'Human-readable label for this snapshot' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    description: 'Environment to capture (omit for all environments)',
    enum: ['DEV', 'UAT', 'PROD'],
  })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'] as const)
  environment?: string;
}
