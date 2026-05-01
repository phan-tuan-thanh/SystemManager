import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FirewallRuleEntity {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() environment: string;
  @ApiPropertyOptional() source_zone_id?: string;
  @ApiPropertyOptional() source_ip?: string;
  @ApiPropertyOptional() destination_zone_id?: string;
  @ApiProperty() destination_server_id: string;
  @ApiPropertyOptional() destination_port_id?: string;
  @ApiProperty() protocol: string;
  @ApiProperty() action: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() request_date?: Date;
  @ApiPropertyOptional() approved_by?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}
