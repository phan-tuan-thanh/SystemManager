import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOsInstallDto {
  @ApiProperty({ example: 'uuid-of-os-application' })
  @IsUUID()
  @IsNotEmpty()
  application_id: string;

  @ApiProperty({ example: '10.0.17763.6659' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  version: string;

  @ApiProperty({ example: '2025-03-15T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  installed_at: string;

  @ApiPropertyOptional({ example: 'Upgrade from Windows Server 2016' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  change_reason?: string;

  @ApiPropertyOptional({ example: 'CR-2025-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  change_ticket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
