import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkImportIpsDto {
  @ApiProperty({
    type: [String],
    example: ['192.168.1.1', '192.168.1.2', '10.0.0.0/24'],
    description: 'Danh sách IP hoặc CIDR range',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ips: string[];
}
