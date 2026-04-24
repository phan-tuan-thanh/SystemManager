import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryInfraSystemDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'BPM' })
  @IsOptional()
  @IsString()
  search?: string;
}
