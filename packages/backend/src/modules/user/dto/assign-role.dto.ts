import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'] as const;

export class AssignRoleDto {
  @ApiProperty({ enum: ROLES })
  @IsNotEmpty()
  @IsIn(ROLES)
  role: typeof ROLES[number];
}
