import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZoneIpEntryEntity {
  @ApiProperty() id: string;
  @ApiProperty() zone_id: string;
  @ApiProperty() ip_address: string;
  @ApiPropertyOptional() label?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() is_range: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class NetworkZoneEntity {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() code: string;
  @ApiProperty() zone_type: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() color?: string;
  @ApiProperty() environment: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional({ type: [ZoneIpEntryEntity] }) ip_entries?: ZoneIpEntryEntity[];
  @ApiPropertyOptional() ip_count?: number;
}
