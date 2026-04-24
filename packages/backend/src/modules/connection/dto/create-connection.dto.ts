import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'] as const;
const CONNECTION_TYPES = ['HTTP', 'HTTPS', 'TCP', 'GRPC', 'AMQP', 'KAFKA', 'DATABASE'] as const;

export class CreateConnectionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  source_app_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  target_app_id: string;

  @ApiProperty({ enum: ENVIRONMENTS })
  @IsIn(ENVIRONMENTS)
  @IsNotEmpty()
  environment: string;

  @ApiProperty({ enum: CONNECTION_TYPES })
  @IsIn(CONNECTION_TYPES)
  @IsNotEmpty()
  connection_type: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  target_port_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
