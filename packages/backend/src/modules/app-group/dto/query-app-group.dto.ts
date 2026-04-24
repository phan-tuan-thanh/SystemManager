import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryAppGroupDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['BUSINESS', 'INFRASTRUCTURE'] })
  @IsOptional()
  @IsIn(['BUSINESS', 'INFRASTRUCTURE'] as const)
  group_type?: 'BUSINESS' | 'INFRASTRUCTURE';
}
