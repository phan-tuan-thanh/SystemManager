import { IsString, IsNotEmpty, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChangeSetDto {
  @ApiProperty({ example: 'Add new PROD server SRV-09' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'])
  environment?: string;
}
