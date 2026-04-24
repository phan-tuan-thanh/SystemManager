import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const RESOURCE_TYPES = ['SERVER', 'APPLICATION', 'NETWORK_CONFIG', 'PORT', 'APP_CONNECTION', 'APP_DEPLOYMENT'] as const;
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;

export class CreateChangeItemDto {
  @ApiProperty({ enum: RESOURCE_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn([...RESOURCE_TYPES])
  resource_type: string;

  @ApiPropertyOptional({ description: 'UUID of the resource — omit for CREATE actions' })
  @IsOptional()
  @IsString()
  resource_id?: string;

  @ApiProperty({ enum: ACTIONS })
  @IsString()
  @IsNotEmpty()
  @IsIn([...ACTIONS])
  action: string;

  @ApiPropertyOptional({ description: 'Current state snapshot (required for UPDATE/DELETE)' })
  @IsOptional()
  old_value?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Desired state (required for CREATE/UPDATE)' })
  @IsOptional()
  new_value?: Record<string, any>;
}
