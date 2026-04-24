import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'] as const;
const SERVER_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;
const INFRA_TYPES = ['VIRTUAL_MACHINE', 'PHYSICAL_SERVER', 'CONTAINER', 'CLOUD_INSTANCE'] as const;
const SITES = ['DC', 'DR'] as const;

export class QueryServerDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ENVIRONMENTS })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: typeof ENVIRONMENTS[number];

  @ApiPropertyOptional({ enum: SERVER_STATUSES })
  @IsOptional()
  @IsIn(SERVER_STATUSES)
  status?: typeof SERVER_STATUSES[number];

  @ApiPropertyOptional({ enum: INFRA_TYPES })
  @IsOptional()
  @IsIn(INFRA_TYPES)
  infra_type?: typeof INFRA_TYPES[number];

  @ApiPropertyOptional({ enum: SITES })
  @IsOptional()
  @IsIn(SITES)
  site?: typeof SITES[number];
}
