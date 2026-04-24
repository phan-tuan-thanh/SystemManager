import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServerDto } from './create-server.dto';

export class UpdateServerDto extends PartialType(OmitType(CreateServerDto, ['code'] as const)) {}
