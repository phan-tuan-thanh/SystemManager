import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const ENVIRONMENTS = ['DEV','UAT','PROD'] as const;
const ACTIONS = ['ALLOW','DENY'] as const;
const STATUSES = ['ACTIVE','INACTIVE','PENDING_APPROVAL','REJECTED'] as const;

export class QueryFirewallRuleDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ENVIRONMENTS })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: string;

  @ApiPropertyOptional({ enum: ACTIONS })
  @IsOptional()
  @IsIn(ACTIONS)
  action?: string;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  source_zone_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destination_server_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
