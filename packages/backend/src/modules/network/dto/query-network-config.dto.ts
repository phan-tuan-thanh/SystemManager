import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'] as const;

export class QueryNetworkConfigDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by server ID' })
  @IsOptional()
  @IsUUID()
  server_id?: string;

  @ApiPropertyOptional({ enum: ENVIRONMENTS })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: typeof ENVIRONMENTS[number];

  @ApiPropertyOptional({ description: 'Filter by IP address (private, public, or NAT)' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ description: 'Search by domain' })
  @IsOptional()
  @IsString()
  search?: string;
}
