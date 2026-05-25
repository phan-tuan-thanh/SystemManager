import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsValidEnvironment } from '../../../common/validators/is-valid-environment.validator';

export class QueryNetworkConfigDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by server ID' })
  @IsOptional()
  @IsUUID()
  server_id?: string;

  @ApiPropertyOptional({ description: 'Environment code (e.g. PROD, UAT, DEV1)' })
  @IsOptional()
  @IsString()
  @IsValidEnvironment()
  environment?: string;

  @ApiPropertyOptional({ description: 'Filter by IP address (private, public, or NAT)' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ description: 'Search by domain' })
  @IsOptional()
  @IsString()
  search?: string;
}
