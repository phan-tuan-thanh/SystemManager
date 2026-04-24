import { PartialType } from '@nestjs/swagger';
import { CreateChangeSetDto } from './create-changeset.dto';

export class UpdateChangeSetDto extends PartialType(CreateChangeSetDto) {}
