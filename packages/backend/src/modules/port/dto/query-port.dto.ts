import { IsOptional, IsUUID, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryPortDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deployment_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  protocol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port_number?: number;
}
