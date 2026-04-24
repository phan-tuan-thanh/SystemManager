import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemSoftwareDto {
  @ApiProperty({ example: 'uuid-of-group' })
  @IsUUID()
  @IsNotEmpty()
  group_id: string;

  @ApiProperty({ example: 'Ubuntu Server' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '22.04 LTS' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional({ example: 'OS' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sw_type?: string;

  @ApiPropertyOptional({ example: '2027-04-30', description: 'End-of-life date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  eol_date?: string;
}
