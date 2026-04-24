import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryApplicationDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  group_id?: string;

  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'])
  environment?: string;

  @ApiPropertyOptional({ enum: ['BUSINESS', 'SYSTEM'] })
  @IsOptional()
  @IsIn(['BUSINESS', 'SYSTEM'] as const)
  application_type?: string;

  @ApiPropertyOptional({ enum: ['OS', 'MIDDLEWARE', 'DATABASE', 'RUNTIME', 'WEB_SERVER', 'OTHER'] })
  @IsOptional()
  @IsIn(['OS', 'MIDDLEWARE', 'DATABASE', 'RUNTIME', 'WEB_SERVER', 'OTHER'] as const)
  sw_type?: string;

  @ApiPropertyOptional({ enum: ['BUSINESS', 'INFRASTRUCTURE'] })
  @IsOptional()
  @IsIn(['BUSINESS', 'INFRASTRUCTURE'] as const)
  group_type?: string;
}
