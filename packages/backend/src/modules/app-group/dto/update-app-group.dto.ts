import { PartialType } from '@nestjs/swagger';
import { CreateAppGroupDto } from './create-app-group.dto';

export class UpdateAppGroupDto extends PartialType(CreateAppGroupDto) {}
