import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManageMembersDto {
  @ApiProperty({ type: [String], description: 'Array of user UUIDs' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  user_ids: string[];
}
