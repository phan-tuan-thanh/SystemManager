import { IsNotEmpty, IsString, IsOptional, IsIn, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'] as const;
const SERVER_PURPOSES = ['APP_SERVER', 'DB_SERVER', 'PROXY', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'OTHER'] as const;
const SERVER_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;
const INFRA_TYPES = ['VIRTUAL_MACHINE', 'PHYSICAL_SERVER', 'CONTAINER', 'CLOUD_INSTANCE'] as const;
const SITES = ['DC', 'DR', 'TEST'] as const;

export class CreateServerDto {
  @ApiProperty({ example: 'SRV-PROD-001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Production App Server 1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'app-server-01.internal' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  hostname: string;

  @ApiProperty({ enum: ENVIRONMENTS })
  @IsNotEmpty()
  @IsIn(ENVIRONMENTS)
  environment: typeof ENVIRONMENTS[number];

  @ApiPropertyOptional({ enum: SERVER_PURPOSES, default: 'APP_SERVER' })
  @IsOptional()
  @IsIn(SERVER_PURPOSES)
  purpose?: typeof SERVER_PURPOSES[number];

  @ApiPropertyOptional({ enum: SERVER_STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsIn(SERVER_STATUSES)
  status?: typeof SERVER_STATUSES[number];

  @ApiPropertyOptional({ enum: INFRA_TYPES, default: 'VIRTUAL_MACHINE' })
  @IsOptional()
  @IsIn(INFRA_TYPES)
  infra_type?: typeof INFRA_TYPES[number];

  @ApiPropertyOptional({ enum: SITES, default: 'DC', description: 'Required for PROD environment only' })
  @IsOptional()
  @IsIn(SITES)
  site?: typeof SITES[number];

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'InfraSystem ID to assign this server to (optional)' })
  @IsOptional()
  @IsUUID()
  infra_system_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
