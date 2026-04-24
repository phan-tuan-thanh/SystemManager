import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientLogDto {
  @ApiProperty({ enum: ['error', 'warn', 'info', 'debug'] })
  @IsEnum(['error', 'warn', 'info', 'debug'])
  level: 'error' | 'warn' | 'info' | 'debug';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;
}

export class BatchClientLogsDto {
  @ApiProperty({ type: [CreateClientLogDto] })
  logs: CreateClientLogDto[];
}
