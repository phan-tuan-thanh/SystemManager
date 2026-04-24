import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GrantAccessDto {
  @ApiPropertyOptional({ description: 'User ID to grant access to' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'UserGroup ID to grant access to' })
  @IsOptional()
  @IsUUID()
  group_id?: string;
}
