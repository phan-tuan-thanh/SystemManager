import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidEnvironment } from '../../../common/validators/is-valid-environment.validator';

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

  @ApiPropertyOptional({ description: 'Environment code (e.g. PROD, UAT, DEV1)' })
  @IsOptional()
  @IsString()
  @IsValidEnvironment()
  environment?: string;
}
