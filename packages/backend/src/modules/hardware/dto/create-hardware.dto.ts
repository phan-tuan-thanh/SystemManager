import { IsNotEmpty, IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const HARDWARE_TYPES = ['CPU', 'RAM', 'HDD', 'SSD', 'NETWORK_CARD'] as const;

export class CreateHardwareDto {
  @ApiProperty({ description: 'Server to attach this component to' })
  @IsNotEmpty()
  @IsUUID()
  server_id: string;

  @ApiProperty({ enum: HARDWARE_TYPES })
  @IsNotEmpty()
  @IsIn(HARDWARE_TYPES)
  type: typeof HARDWARE_TYPES[number];

  @ApiPropertyOptional({ example: 'Intel Xeon E5-2680' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'Intel' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'SN-12345678' })
  @IsOptional()
  @IsString()
  serial?: string;

  @ApiPropertyOptional({ description: 'JSON specs (cores, speed, capacity, etc.)' })
  @IsOptional()
  specs?: Record<string, any>;
}
