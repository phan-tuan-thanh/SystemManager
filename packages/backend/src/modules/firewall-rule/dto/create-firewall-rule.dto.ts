import {
  IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsIn, IsDateString, IsBoolean, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ENVIRONMENTS = ['DEV','UAT','PROD'] as const;
const ACTIONS = ['ALLOW','DENY'] as const;
const STATUSES = ['ACTIVE','INACTIVE','PENDING_APPROVAL','REJECTED'] as const;

export class CreateFirewallRuleDto {
  @ApiProperty({ example: 'Allow DMZ to API Server 8080' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ENVIRONMENTS })
  @IsNotEmpty()
  @IsIn(ENVIRONMENTS)
  environment: string;

  @ApiPropertyOptional({ description: 'UUID của NetworkZone nguồn' })
  @IsOptional()
  @IsUUID()
  source_zone_id?: string;

  @ApiPropertyOptional({ example: '192.168.1.100', description: 'IP cụ thể của nguồn (nếu không dùng zone)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source_ip?: string;

  @ApiPropertyOptional({ description: 'UUID của NetworkZone đích' })
  @IsOptional()
  @IsUUID()
  destination_zone_id?: string;

  @ApiProperty({ description: 'UUID của Server đích' })
  @IsNotEmpty()
  @IsUUID()
  destination_server_id: string;

  @ApiPropertyOptional({ description: 'UUID của Port lắng nghe trên server đích' })
  @IsOptional()
  @IsUUID()
  destination_port_id?: string;

  @ApiPropertyOptional({ example: 8080, description: 'Số port thủ công khi chưa có Port entity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  destination_port_number?: number;

  @ApiPropertyOptional({ example: 'TCP', default: 'TCP' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  protocol?: string;

  @ApiPropertyOptional({ enum: ACTIONS, default: 'ALLOW' })
  @IsOptional()
  @IsIn(ACTIONS)
  action?: string;

  @ApiPropertyOptional({ enum: STATUSES, default: 'PENDING_APPROVAL' })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  request_date?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  approved_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Ngày hết hạn của rule (null = vô thời hạn). ISO date string.',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'True = rule không có thời hạn hết hạn (vô thời hạn)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  never_expires?: boolean;
}
