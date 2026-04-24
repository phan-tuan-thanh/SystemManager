import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
  'ENABLE_MODULE', 'DISABLE_MODULE', 'VIEW_SENSITIVE',
] as const;
type AuditAction = typeof AUDIT_ACTIONS[number];

export class QueryAuditDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AUDIT_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_ACTIONS)
  action?: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
