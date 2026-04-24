import { PartialType } from '@nestjs/swagger';
import { CreateInfraSystemDto } from './create-infra-system.dto';

export class UpdateInfraSystemDto extends PartialType(CreateInfraSystemDto) {}
