import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const ENVIRONMENTS = ['DEV','UAT','PROD'] as const;
const ZONE_TYPES = ['LOCAL','DMZ','DB','DEV','UAT','PROD','INTERNET','MANAGEMENT','STORAGE','BACKUP','CUSTOM'] as const;

export class QueryNetworkZoneDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ENVIRONMENTS })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: string;

  @ApiPropertyOptional({ enum: ZONE_TYPES })
  @IsOptional()
  @IsIn(ZONE_TYPES)
  zone_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
