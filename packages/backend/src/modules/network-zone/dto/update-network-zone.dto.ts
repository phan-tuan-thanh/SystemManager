import { PartialType } from '@nestjs/swagger';
import { CreateNetworkZoneDto } from './create-network-zone.dto';

export class UpdateNetworkZoneDto extends PartialType(CreateNetworkZoneDto) {}
