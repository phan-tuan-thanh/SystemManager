import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'] as const;
const CONNECTION_TYPES = ['HTTP', 'HTTPS', 'TCP', 'GRPC', 'AMQP', 'KAFKA', 'DATABASE'] as const;

export class QueryConnectionDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ENVIRONMENTS })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  source_app_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  target_app_id?: string;

  @ApiPropertyOptional({ enum: CONNECTION_TYPES })
  @IsOptional()
  @IsIn(CONNECTION_TYPES)
  connection_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
