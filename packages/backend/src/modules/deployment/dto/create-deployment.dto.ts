import {
  IsNotEmpty, IsOptional, IsString, IsUUID, IsIn, IsDateString, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeploymentDto {
  @ApiProperty({ example: 'uuid-of-application' })
  @IsUUID()
  @IsNotEmpty()
  application_id: string;

  @ApiProperty({ example: 'uuid-of-server' })
  @IsUUID()
  @IsNotEmpty()
  server_id: string;

  @ApiProperty({ enum: ['DEV', 'UAT', 'PROD'] })
  @IsIn(['DEV', 'UAT', 'PROD'])
  @IsNotEmpty()
  environment: string;

  @ApiProperty({ example: '2.1.0' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  version: string;

  @ApiPropertyOptional({ enum: ['RUNNING', 'STOPPED', 'DEPRECATED'] })
  @IsOptional()
  @IsIn(['RUNNING', 'STOPPED', 'DEPRECATED'])
  status?: string;

  @ApiPropertyOptional({ example: 'Core Banking v2.1.0 PROD deployment' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  deployed_at?: string;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  planned_at?: string;

  @ApiPropertyOptional({ example: 'CMC-20260501-001' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cmc_name?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deployer?: string;
}
