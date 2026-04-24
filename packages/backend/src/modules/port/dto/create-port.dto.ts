import {
  IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, Max, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePortDto {
  @ApiProperty({ example: 'uuid-of-application' })
  @IsUUID()
  @IsNotEmpty()
  application_id: string;

  @ApiPropertyOptional({ example: 'uuid-of-deployment', description: 'If set, port belongs to a specific deployment on a server (enables conflict detection)' })
  @IsOptional()
  @IsUUID()
  deployment_id?: string;

  @ApiProperty({ example: 8080 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port_number: number;

  @ApiPropertyOptional({ example: 'TCP', default: 'TCP' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  protocol?: string;

  @ApiPropertyOptional({ example: 'HTTP API' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  service_name?: string;
}
