import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnvironmentType } from '@prisma/client';

export class EnvironmentConfigEntity {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() label: string;
  @ApiProperty({ enum: EnvironmentType }) type: EnvironmentType;
  @ApiProperty() color: string;
  @ApiProperty() sort_order: number;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}
