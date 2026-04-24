import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachHardwareDto {
  @ApiProperty({ description: 'Target server ID to attach this component to' })
  @IsNotEmpty()
  @IsUUID()
  server_id: string;
}
