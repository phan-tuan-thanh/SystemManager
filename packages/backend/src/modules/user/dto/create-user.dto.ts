import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'] as const;

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: USER_STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: typeof USER_STATUSES[number];
}
