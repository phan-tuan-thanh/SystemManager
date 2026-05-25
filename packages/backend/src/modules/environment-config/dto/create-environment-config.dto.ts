import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min, MaxLength, Matches } from 'class-validator';
import { EnvironmentType } from '@prisma/client';

export class CreateEnvironmentConfigDto {
  @ApiProperty({ example: 'DEV1', description: 'Unique code, uppercase alphanumeric' })
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9_]+$/, { message: 'code must be uppercase alphanumeric (A-Z, 0-9, _)' })
  code: string;

  @ApiProperty({ example: 'Development 1' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ enum: EnvironmentType })
  @IsEnum(EnvironmentType)
  type: EnvironmentType;

  @ApiPropertyOptional({ example: '#52c41a', default: '#1890ff' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a valid hex color (#RRGGBB)' })
  color?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
