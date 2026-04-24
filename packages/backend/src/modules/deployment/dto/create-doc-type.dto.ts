import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, IsArray, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocTypeDto {
  @ApiProperty({ example: 'TECHNICAL_DESIGN' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Technical Design Document' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({
    description: 'Environments that require this doc. Empty = all envs.',
    example: ['PROD'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  environments?: string[];
}
