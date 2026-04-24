import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeItemEntity {
  @ApiProperty() id: string;
  @ApiProperty() changeset_id: string;
  @ApiProperty() resource_type: string;
  @ApiPropertyOptional() resource_id?: string;
  @ApiProperty() action: string;
  @ApiPropertyOptional() old_value?: any;
  @ApiPropertyOptional() new_value?: any;
  @ApiProperty() created_at: Date;
}

export class ChangeSetEntity {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: ['DRAFT', 'PREVIEWING', 'APPLIED', 'DISCARDED'] }) status: string;
  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] }) environment?: string;
  @ApiProperty() created_by: string;
  @ApiPropertyOptional() applied_at?: Date;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional({ type: () => [ChangeItemEntity] }) items?: ChangeItemEntity[];
}
