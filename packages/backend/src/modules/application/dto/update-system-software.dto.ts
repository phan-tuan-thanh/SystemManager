import { PartialType } from '@nestjs/swagger';
import { CreateSystemSoftwareDto } from './create-system-software.dto';

export class UpdateSystemSoftwareDto extends PartialType(CreateSystemSoftwareDto) {}
