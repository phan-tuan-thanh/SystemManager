import {
  IsNotEmpty, IsOptional, IsString, MaxLength, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidEnvironment } from '../../../common/validators/is-valid-environment.validator';

const ZONE_TYPES = ['LOCAL','DMZ','DB','DEV','UAT','PROD','INTERNET','MANAGEMENT','STORAGE','BACKUP','CUSTOM'] as const;

export class CreateNetworkZoneDto {
  @ApiProperty({ example: 'DMZ Zone' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'DMZ' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ enum: ZONE_TYPES, default: 'CUSTOM' })
  @IsOptional()
  @IsIn(ZONE_TYPES)
  zone_type?: string;

  @ApiPropertyOptional({ example: 'Khu vực DMZ — máy chủ công khai' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#FF6B6B', description: 'Hex color cho hiển thị topology' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiProperty({ example: 'PROD', description: 'Environment code (e.g. PROD, UAT, DEV1)' })
  @IsNotEmpty()
  @IsString()
  @IsValidEnvironment()
  environment: string;
}
