import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuerySnapshotDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'] as const)
  environment?: string;
}
