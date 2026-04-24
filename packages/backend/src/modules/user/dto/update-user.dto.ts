import { IsString, IsOptional, IsIn, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'] as const;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: typeof USER_STATUSES[number];

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}
