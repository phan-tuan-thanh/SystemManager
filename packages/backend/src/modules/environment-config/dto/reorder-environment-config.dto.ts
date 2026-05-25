import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderEnvironmentConfigDto {
  @ApiProperty({ example: ['PROD', 'UAT', 'DEV1', 'DEV2'], description: 'Ordered list of environment codes' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  codes: string[];
}
