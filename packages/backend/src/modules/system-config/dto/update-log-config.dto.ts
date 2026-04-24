import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '../../../common/logger/log-level.type';

export class UpdateLogConfigDto {
  @ApiPropertyOptional({ description: 'Master logging switch' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: ['error', 'warn', 'log', 'debug', 'verbose'] })
  @IsEnum(['error', 'warn', 'log', 'debug', 'verbose'])
  @IsOptional()
  level?: LogLevel;

  @ApiPropertyOptional({ description: 'Write logs to rotating file' })
  @IsBoolean()
  @IsOptional()
  toFile?: boolean;

  @ApiPropertyOptional({ description: 'Write logs to console' })
  @IsBoolean()
  @IsOptional()
  toConsole?: boolean;
}
