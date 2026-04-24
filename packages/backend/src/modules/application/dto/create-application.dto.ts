import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'uuid-of-group' })
  @IsUUID()
  @IsNotEmpty()
  group_id: string;

  @ApiProperty({ example: 'CORE_BANKING_APP' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Core Banking Application' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '2.1.0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Platform Team' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  owner_team?: string;

  @ApiPropertyOptional({ enum: ['BUSINESS', 'SYSTEM'], default: 'BUSINESS' })
  @IsOptional()
  @IsIn(['BUSINESS', 'SYSTEM'] as const)
  application_type?: 'BUSINESS' | 'SYSTEM';

  @ApiPropertyOptional({ enum: ['OS', 'MIDDLEWARE', 'DATABASE', 'RUNTIME', 'WEB_SERVER', 'OTHER'] })
  @IsOptional()
  @IsIn(['OS', 'MIDDLEWARE', 'DATABASE', 'RUNTIME', 'WEB_SERVER', 'OTHER'] as const)
  sw_type?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  eol_date?: string;

  @ApiPropertyOptional({ example: 'Microsoft' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor?: string;
}
