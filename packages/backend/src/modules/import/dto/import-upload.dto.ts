import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportPreviewDto {
  @ApiProperty({ description: 'Target entity type', enum: ['server', 'application', 'deployment'] })
  @IsIn(['server', 'application', 'deployment'] as const)
  type: 'server' | 'application' | 'deployment';

  @ApiPropertyOptional({ description: 'Target environment for import' })
  @IsOptional()
  @IsIn(['DEV', 'UAT', 'PROD'] as const)
  environment?: 'DEV' | 'UAT' | 'PROD';
}

export class ImportConfirmDto {
  @ApiProperty({ description: 'Session token from preview step' })
  @IsString()
  session_id: string;

  @ApiPropertyOptional({ description: 'Map of raw OS name -> selected application_id' })
  @IsOptional()
  @IsObject()
  os_resolution?: Record<string, string>;
}

export interface ImportRow {
  row: number;
  data: Record<string, string | number | undefined>;
  errors: string[];
  valid: boolean;
}

export interface ImportPreviewResult {
  session_id: string;
  type: string;
  total: number;
  valid: number;
  invalid: number;
  rows: ImportRow[];
  columns: string[];
  os_resolution?: Array<{
    raw: string;
    suggested_app_id?: string;
    suggested_name?: string;
    is_new: boolean;
  }>;
}
