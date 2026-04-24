import { IsNotEmpty, IsString, IsOptional, IsArray, IsUUID, MaxLength, IsIP } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNetworkConfigDto {
  @ApiProperty({ example: 'uuid-of-server' })
  @IsNotEmpty()
  @IsUUID()
  server_id: string;

  @ApiPropertyOptional({ example: 'eth0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  interface?: string;

  @ApiPropertyOptional({ example: '10.0.1.5' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  private_ip?: string;

  @ApiPropertyOptional({ example: '203.0.113.10' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  public_ip?: string;

  @ApiPropertyOptional({ example: '10.0.0.1' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  nat_ip?: string;

  @ApiPropertyOptional({ example: 'app.example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional({ example: '10.0.1.0/24' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subnet?: string;

  @ApiPropertyOptional({ example: '10.0.1.1' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  gateway?: string;

  @ApiPropertyOptional({ example: ['8.8.8.8', '8.8.4.4'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dns?: string[];
}
