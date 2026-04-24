import { IsNotEmpty, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppGroupDto {
  @ApiProperty({ example: 'CORE_BANKING' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Core Banking Applications' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['BUSINESS', 'INFRASTRUCTURE'], example: 'BUSINESS' })
  @IsNotEmpty()
  @IsIn(['BUSINESS', 'INFRASTRUCTURE'] as const)
  group_type: 'BUSINESS' | 'INFRASTRUCTURE';
}
