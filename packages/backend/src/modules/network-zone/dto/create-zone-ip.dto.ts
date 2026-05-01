import { IsNotEmpty, IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneIpDto {
  @ApiProperty({ example: '192.168.1.100', description: 'IP address or CIDR range' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  ip_address: string;

  @ApiPropertyOptional({ example: 'Web Server 01' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false, description: 'true nếu ip_address là CIDR (vd: 192.168.1.0/24)' })
  @IsOptional()
  @IsBoolean()
  is_range?: boolean;
}
