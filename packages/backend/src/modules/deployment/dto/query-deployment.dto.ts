import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryDeploymentDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  server_id?: string;

  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'])
  environment?: string;

  @ApiPropertyOptional({ enum: ['RUNNING', 'STOPPED', 'DEPRECATED'] })
  @IsOptional()
  @IsIn(['RUNNING', 'STOPPED', 'DEPRECATED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
