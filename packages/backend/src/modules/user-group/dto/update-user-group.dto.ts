import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'] as const;
const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export class UpdateUserGroupDto {
  @ApiPropertyOptional({ example: 'Development Team' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Backend and frontend developers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  default_role?: typeof ROLES[number];

  @ApiPropertyOptional({ description: 'UUID of group leader user' })
  @IsOptional()
  @IsUUID()
  leader_id?: string;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: typeof STATUSES[number];
}
