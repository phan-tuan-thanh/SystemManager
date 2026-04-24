import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SnapshotEntity {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  label?: string;

  @ApiPropertyOptional({ enum: ['DEV', 'UAT', 'PROD'] })
  environment?: string;

  @ApiProperty({ description: 'Full topology payload as JSON' })
  payload: Record<string, any>;

  @ApiPropertyOptional()
  created_by?: string;

  @ApiProperty()
  created_at: Date;
}
