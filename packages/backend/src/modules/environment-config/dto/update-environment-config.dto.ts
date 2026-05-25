import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEnvironmentConfigDto } from './create-environment-config.dto';

export class UpdateEnvironmentConfigDto extends PartialType(
  OmitType(CreateEnvironmentConfigDto, ['code'] as const),
) {}
