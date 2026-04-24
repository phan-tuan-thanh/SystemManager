import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryChangeSetDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PREVIEWING', 'APPLIED', 'DISCARDED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'])
  environment?: string;

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsString()
  created_by?: string;
}
