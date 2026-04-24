import { IsString, IsNotEmpty, IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'] as const;
const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export class CreateUserGroupDto {
  @ApiProperty({ example: 'DEV_TEAM' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Development Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Backend and frontend developers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ROLES, default: 'VIEWER' })
  @IsOptional()
  @IsIn(ROLES)
  default_role?: typeof ROLES[number];

  @ApiPropertyOptional({ description: 'UUID of group leader user' })
  @IsOptional()
  @IsUUID()
  leader_id?: string;

  @ApiPropertyOptional({ enum: STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsIn(STATUSES)
  status?: typeof STATUSES[number];
}
