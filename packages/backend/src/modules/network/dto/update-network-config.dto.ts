import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateNetworkConfigDto } from './create-network-config.dto';

export class UpdateNetworkConfigDto extends PartialType(
  OmitType(CreateNetworkConfigDto, ['server_id'] as const),
) {}
