import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const HARDWARE_TYPES = ['CPU', 'RAM', 'HDD', 'SSD', 'NETWORK_CARD'] as const;

export class QueryHardwareDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by server ID' })
  @IsOptional()
  @IsUUID()
  server_id?: string;

  @ApiPropertyOptional({ enum: HARDWARE_TYPES })
  @IsOptional()
  @IsIn(HARDWARE_TYPES)
  type?: typeof HARDWARE_TYPES[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
